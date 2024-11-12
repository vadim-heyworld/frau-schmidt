import { Buffer } from 'buffer';

import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { CommentReply, PRDetails } from '../types/index.js';
import { parsePatch } from '../utils/diffParser.js';

export class GitHubService {
  private readonly octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
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
      .filter(review => review.user?.login === 'frau-schmidt');

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

  async getCommentReplies(
    repo: { owner: string; repo: string },
    prNumber: number,
    botUsername: string
  ): Promise<CommentReply[]> {
    const { data: pr } = await this.octokit.rest.pulls.get({
      ...repo,
      pull_number: prNumber,
    });

    const prAuthor = pr.user.login;

    const { data: comments } = await this.octokit.rest.pulls.listReviewComments({
      ...repo,
      pull_number: prNumber,
    });

    const replies: CommentReply[] = [];

    for (const comment of comments) {
      if (
        comment.in_reply_to_id &&
        comment.body?.includes(`@${botUsername}`) &&
        comment.user?.login !== botUsername // Exclude bot's own comments
      ) {
        const originalComment = comments.find(c => c.id === comment.in_reply_to_id);
        if (originalComment?.user?.login === botUsername) {
          const lineNumber = comment.original_line || comment.line;
          if (typeof lineNumber !== 'number') {
            core.warning(`Unable to determine line number for comment ${comment.id}`);
            continue;
          }
          const diffContext = await this.getDiffContext(repo, comment.path, lineNumber, prNumber);

          replies.push({
            replyComment: {
              id: comment.id,
              body: comment.body,
              user: {
                login: comment.user.login,
              },
              path: comment.path,
              line: lineNumber,
              original_line: comment.original_line,
            },
            originalComment: {
              id: originalComment.id,
              body: originalComment.body,
              user: {
                login: originalComment.user.login,
              },
            },
            commentContext: {
              lineContent: await this.getLineContent(repo, comment.path, lineNumber),
              diffContext,
            },
            userLogin: comment.user.login,
            isPRAuthor: comment.user.login === prAuthor,
          });
        }
      }
    }

    return replies;
  }

  async replyToComment(
    repo: { owner: string; repo: string },
    prNumber: number,
    inReplyToId: number,
    body: string,
    userLogin: string
  ): Promise<void> {
    try {
      await this.octokit.rest.pulls.createReplyForReviewComment({
        ...repo,
        pull_number: prNumber,
        body: `@${userLogin} ${body}`,
        comment_id: inReplyToId,
      });
    } catch (error) {
      core.warning(`Failed to create reply to comment: ${error}`);
    }
  }

  private async getDiffContext(
    repo: { owner: string; repo: string },
    path: string,
    line: number,
    prNumber: number
  ): Promise<string> {
    try {
      const { data: files } = await this.octokit.rest.pulls.listFiles({
        ...repo,
        pull_number: prNumber,
        path,
      });

      const file = files.find(f => f.filename === path);
      if (file?.patch) {
        const hunks = parsePatch(file.patch);
        const contextLines = [];
        const CONTEXT_LINES = 3;

        for (const hunk of hunks) {
          const relevantChanges = hunk.changes.filter(
            change => Math.abs(change.lineNumber - line) <= CONTEXT_LINES
          );

          if (relevantChanges.length > 0) {
            const lineMarkers = relevantChanges.map(change => {
              const prefix = change.type === 'add' ? '+' : change.type === 'del' ? '-' : ' ';
              const lineNum = change.lineNumber === line ? '>' : ' ';
              return `${lineNum}${prefix}${change.content}`;
            });
            contextLines.push(...lineMarkers);
          }
        }

        return contextLines.join('\n');
      }
      return '';
    } catch (error) {
      core.warning(`Failed to get diff context: ${error}`);
      return '';
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
