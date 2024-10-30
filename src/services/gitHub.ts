import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { PRDetails } from '../types/index.js';

export class GitHubService {
  private readonly octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
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

    const { data: commits } = await this.octokit.rest.pulls.listCommits({
      ...repo,
      pull_number: prNumber,
    });

    const { data: files } = await this.octokit.rest.pulls.listFiles({
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
}
