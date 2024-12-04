import * as core from '@actions/core';
import * as github from '@actions/github';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { OpenAI } from 'openai';

import { ReviewComment } from 'index.js';

import { GitHubService } from './services/github.js';
import { OpenAIService } from './services/openai.js';
import { processFileChange } from './utils/chagesProcessor.js';
import { readProjectPrompts } from './utils/projectPrompts.js';

async function run(): Promise<void> {
  try {
    const botUsername = 'frau-schmidt';
    const { octokit, openai, model } = initializeServices();
    const githubService = new GitHubService(octokit, botUsername);
    const openAIService = new OpenAIService(openai, model);
    const fullScan = core.getBooleanInput('full-scan') || false;
    const enableReplies = core.getBooleanInput('enable-replies') || false;
    const includeProjectPromptsInReplies =
      core.getBooleanInput('include-project-prompts-in-replies') || false;
    const context = github.context;

    if (!context.payload.pull_request) {
      core.setFailed('This action can only be run on pull requests');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    if (context.eventName === 'pull_request') {
      // 0. Get Last Reviewed Commit SHA
      const lastReviewedCommitSha = await githubService.getLastReviewedCommitSha(repo, prNumber);

      // 1. Get PR Details
      const prDetails = await githubService.getPRDetails(repo, prNumber, lastReviewedCommitSha);
      if (!prDetails || !prDetails.files || prDetails.files.length === 0) {
        core.info('No changes in PR');
        return;
      }

      // 2. Read project prompts
      const projectPrompts = readProjectPrompts(core.getInput('project-name'));
      let commentsArr: ReviewComment[] = [];

      // 3. Analize PR file changes and collect related comments
      for (const file of prDetails.files) {
        const fileChange = processFileChange(file);
        core.info(`Processing file: ${file.filename}`);

        // if fullScan is enabled, we need to fetch the full file content to analyze it besides the diff
        if (fullScan) {
          const fileContent = await githubService.getFileContent(
            repo,
            file.filename,
            lastReviewedCommitSha ?? prDetails.commitId
          );
          if (fileContent) {
            fileChange.fullContent = fileContent;
          }
        }

        // Analyze file changes and create comments if needed
        const comments = await openAIService.analyzePRChanges(fileChange, projectPrompts);
        // Collect comments to finalize review and a summary comment
        commentsArr = commentsArr.concat(comments);
      }

      // 4. Analize PR metadata and comments which we made to prepare a summary comment
      const reviewSummary = await openAIService.analyzePRInfo(prDetails, commentsArr);

      // 5. Submit review
      await githubService.submitReview(repo, prNumber, commentsArr, reviewSummary);
    }

    if (context.eventName === 'pull_request_review_comment' && enableReplies) {
      const comment = context.payload.comment;
      if (!comment?.body || !comment.body.includes('/why')) {
        return;
      }

      core.info(
        `Received a comment on PR ${prNumber} from @${context.payload.comment?.user?.login}`
      );

      core.info(`Comment data: ${JSON.stringify(context.payload.comment)}`);

      const projectPrompts = includeProjectPromptsInReplies
        ? readProjectPrompts(core.getInput('project-name'))
        : undefined;

      const triggerComment = {
        id: comment.id,
        originalCommentId: comment.in_reply_to_id,
        userLogin: comment.user.login,
        isPrAuthor: comment.user.login === context.payload.pull_request.user.login,
        body: comment.body,
      };
      const thread = await githubService.getCommentThread(repo, prNumber, triggerComment);
      const response = await openAIService.analyzeReply(thread, projectPrompts);

      await githubService.replyToComment(
        repo,
        prNumber,
        thread.triggerComment.id,
        thread.triggerComment.userLogin,
        response
      );

      core.info(
        `Replied to ${thread.triggerComment.isPrAuthor ? 'PR author' : 'reviewer'} @${thread.triggerComment.userLogin} on comment ${thread.triggerComment.id}`
      );
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

function initializeServices(): { octokit: Octokit; openai: OpenAI; model: string } {
  const appId = parseInt(core.getInput('app-id', { required: true }));
  const privateKey = core.getInput('private-key', { required: true });
  const installationId = parseInt(core.getInput('installation-id', { required: true }));
  const openaiApiKey = core.getInput('openai-api-key', { required: true });
  const model = core.getInput('openai-model', { required: true });

  if (isNaN(appId)) {
    throw new Error(`app-id must be a valid number: ${appId}`);
  }
  if (isNaN(installationId)) {
    throw new Error(`installation-id must be a valid number: ${installationId}`);
  }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  const openai = new OpenAI({ apiKey: openaiApiKey });

  return { octokit, openai, model };
}

run();
