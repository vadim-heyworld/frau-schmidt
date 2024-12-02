import { Buffer } from 'buffer';

import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { CommentThread, Comment, PRDetails, DiffHunk } from '../types/index.js';
import { parsePatch } from '../utils/chagesProcessor.js';

export class GitHubService {
  private readonly octokit: Octokit;
  private readonly botUsername: string = 'frau-schmidt';

  constructor(octokit: Octokit, botUsername: string) {
    this.octokit = octokit;
    this.botUsername = botUsername;
  }

  async getFileContent(
    repo: { owner: string; repo: string },
    path: string,
    ref: string
  ): Promise<string | null> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        ...repo,
        path,
        ref,
      });

      if ('content' in response.data) {
        return Buffer.from(response.data.content, 'base64').toString();
      }
      return null;
    } catch (error) {
      core.warning(`Failed to fetch file content for ${path}: ${error}`);
      return null;
    }
  }

  async createReviewComment(
    repo: { owner: string; repo: string },
    prNumber: number,
    commitId: string,
    path: string,
    body: string,
    line: number
  ): Promise<void> {
    try {
      await this.octokit.rest.pulls.createReviewComment({
        ...repo,
        pull_number: prNumber,
        commit_id: commitId,
        body,
        path,
        line,
        side: 'RIGHT',
        position: line,
      });
    } catch (error) {
      core.warning(`Failed to create review comment at line ${line}: ${error}`);
    }
  }

  async createPRComment(
    repo: { owner: string; repo: string },
    prNumber: number,
    body: string
  ): Promise<void> {
    await this.octokit.rest.issues.createComment({
      ...repo,
      issue_number: prNumber,
      body,
    });
  }

  async getPRDetails(repo: { owner: string; repo: string }, prNumber: number): Promise<PRDetails> {
    const { data: pullRequest } = await this.octokit.rest.pulls.get({
      ...repo,
      pull_number: prNumber,
    });

    const { data: reviews } = await this.octokit.rest.pulls.listReviews({
      ...repo,
      pull_number: prNumber,
    });

    const botReviews = reviews
      .sort(
        (a, b) =>
          new Date(b.submitted_at || '').getTime() - new Date(a.submitted_at || '').getTime()
      )
      .filter(review => review.user?.login === this.botUsername);

    const lastBotReview = botReviews[0];
    const lastReviewCommitId = lastBotReview?.commit_id ?? undefined;

    const { data: files } = await this.octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: prNumber,
      ...(lastReviewCommitId && { base: lastReviewCommitId }),
    });

    const { data: commits } = await this.octokit.rest.pulls.listCommits({
      ...repo,
      pull_number: prNumber,
    });

    return {
      pullRequest,
      commits,
      files,
      commitId: pullRequest.head.sha,
      prDescription: pullRequest.body || '',
      branchName: pullRequest.head.ref,
      commitMessages: commits.map(commit => commit.commit.message),
    };
  }

  async getCommentThread(
    repo: { owner: string; repo: string },
    prNumber: number,
    triggerComment: Comment
  ): Promise<CommentThread> {
    const { data: pr } = await this.octokit.rest.pulls.get({
      ...repo,
      pull_number: prNumber,
    });

    const prAuthor = pr.user.login;

    // TODO:: implement pagination
    const { data: comments } = await this.octokit.rest.pulls.listReviewComments({
      ...repo,
      pull_number: prNumber,
      per_page: 100,
      sort: 'created',
      direction: 'desc', // latest first
    });

    const threadComments: Comment[] = [];
    let diffHunks: DiffHunk[] = [];
    let lineContent = '';
    core.info(`Found ${comments.length} comments`);
    for (const comment of comments) {
      // first lets find the comment that triggered the bot, it should be the last comment with `/why` command
      if (comment.id === triggerComment.id) {
        core.info(`Found triggered comment: ${comment.body}`);
        diffHunks = parsePatch(comment.diff_hunk);
        lineContent = await this.getLineContent(repo, comment.path, comment.position ?? -1);
        continue;
      }

      // now let's find all other comments that are part of this thread
      if (comment.in_reply_to_id === triggerComment.originalCommentId) {
        const threadComment = {
          id: comment.id,
          originalCommentId: comment.in_reply_to_id,
          userLogin: comment.user.login,
          isPrAuthor: comment.user.login === prAuthor,
          body: comment.body,
        };

        threadComments.push(threadComment);
      }
    }

    return {
      diffHunks: diffHunks,
      triggerComment: triggerComment,
      comments: threadComments,
      commentLine: lineContent,
    };
  }

  async replyToComment(
    repo: { owner: string; repo: string },
    prNumber: number,
    inReplyToId: number,
    replyToUser: string,
    replyBody: string
  ): Promise<void> {
    try {
      await this.octokit.rest.pulls.createReplyForReviewComment({
        ...repo,
        pull_number: prNumber,
        body: `@${replyToUser} ${replyBody}`,
        comment_id: inReplyToId,
      });
    } catch (error) {
      core.warning(`Failed to create reply to comment: ${error}`);
    }
  }

  private async getLineContent(
    repo: { owner: string; repo: string },
    path: string,
    line: number
  ): Promise<string> {
    try {
      const content = await this.getFileContent(repo, path, 'HEAD');
      if (content) {
        const lines = content.split('\n');
        return lines[line - 1] || '';
      }
      return '';
    } catch (error) {
      core.warning(`Failed to get line content: ${error}`);
      return '';
    }
  }
}
