import { Buffer } from 'buffer';

import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { CommentThread, Comment, PRDetails, DiffHunk, ReviewComment } from '../types/index.js';
import { parsePatch } from '../utils/chagesProcessor.js';

export class GitHubService {
  private readonly octokit: Octokit;
  private readonly botUsername: string = 'frau-schmidt[bot]';

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

  async submitReview(
    repo: { owner: string; repo: string },
    prNumber: number,
    comments: ReviewComment[],
    summary: string
  ): Promise<void> {
    await this.octokit.rest.pulls.createReview({
      ...repo,
      pull_number: prNumber,
      event: 'COMMENT',
      body: summary,
      comments: comments.map(comment => ({
        body: comment.body,
        path: comment.path,
        position: comment.position,
      })),
    });
  }

  async getPRDetails(
    repo: { owner: string; repo: string },
    prNumber: number,
    lastReviewedSha: string | null
  ): Promise<PRDetails | null> {
    const { data: pullRequest } = await this.octokit.rest.pulls.get({
      ...repo,
      pull_number: prNumber,
    });
    const latestSha = pullRequest.head.sha;
    core.info(`Latest commit SHA: ${latestSha}`);
    core.info(`Latest review commit: ${lastReviewedSha}`);

    if (lastReviewedSha === null) {
      core.info(`No previous reviews; consider all changes`);
      lastReviewedSha = pullRequest.base.sha;
    }

    if (latestSha === lastReviewedSha) {
      core.info(`No changes since the last review: ${lastReviewedSha}`);
      return null;
    }

    const basehead = `${lastReviewedSha}...${latestSha}`;
    const comparison = await this.octokit.repos.compareCommitsWithBasehead({
      ...repo,
      basehead: basehead,
      per_page: 100,
    });

    const newCommits = comparison.data.commits;
    core.info(`Found ${newCommits.length} new commits: ${newCommits.map(c => c.sha).join(', ')}`);
    const changedFiles = comparison.data.files;

    return {
      pullRequest,
      commits: newCommits,
      files: changedFiles,
      commitId: pullRequest.head.sha,
      prDescription: pullRequest.body || '',
      branchName: pullRequest.head.ref,
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
      if (comment.id === triggerComment.id) {
        core.info(`Found triggered comment: ${comment.body}`);
        diffHunks = parsePatch(comment.diff_hunk);
        lineContent = await this.getLineContent(repo, comment.path, comment.position ?? -1);
        continue;
      }

      // let's find all other comments that are part of this thread
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

  async getLastReviewedCommitSha(
    repo: { owner: string; repo: string },
    prNumber: number
  ): Promise<string | null> {
    const reviewsResponse = await this.octokit.pulls.listReviews({
      ...repo,
      pull_number: prNumber,
    });

    core.info(`Found ${reviewsResponse.data.length} reviews`);
    core.info(`Reviews data ${JSON.stringify(reviewsResponse.data)}`);

    const botReviews = reviewsResponse.data.filter(
      review => review.user?.login === this.botUsername
    );

    core.info(`Found ${botReviews.length} reviews by the bot`);

    if (botReviews.length === 0) {
      core.info(`Bot has not reviewed PR ${prNumber} yet`);
      return null;
    }

    // Find the latest review by the bot
    const latestReview = botReviews.reduce((latest, review) => {
      return new Date(review.submitted_at!) > new Date(latest.submitted_at!) ? review : latest;
    });
    core.info(`Latest review by the bot stats: ${JSON.stringify(latestReview)}`);

    return latestReview.commit_id;
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
