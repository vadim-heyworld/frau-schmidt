import * as core from '@actions/core';
import * as github from '@actions/github';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { OpenAI } from 'openai';

import { GitHubService } from './services/gitHub.js';
import { OpenAIService } from './services/openAI.js';
import { processFileChange } from './utils/diffParser.js';
import { readProjectPrompts } from './utils/prompt.js';

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
      const { files, commitId, prDescription, branchName, commitMessages } =
        await githubService.getPRDetails(repo, prNumber);

      const projectPrompts = readProjectPrompts(core.getInput('project-name'));
      let commentsArr: string[] = [];

      // 1. Analize PR file changes and create related comments
      for (const file of files) {
        const fileChange = processFileChange(file);
        if (fullScan) {
          const fileContent = await githubService.getFileContent(repo, file.filename, commitId);
          if (fileContent) {
            fileChange.fullContent = fileContent;
          }
        }

        const comments = await openAIService.analyzePRChanges(fileChange, projectPrompts);
        commentsArr = commentsArr.concat(comments.map(c => c.comment));

        for (const comment of comments) {
          await githubService.createReviewComment(
            repo,
            prNumber,
            commitId,
            file.filename,
            comment.comment,
            comment.line
          );
          core.info(
            `Created a comment on ${file.filename} at line ${comment.line} with: ${comment.comment}`
          );
        }
      }

      // 2. Analize PR metadata and comments which we made to prepare a summary comment
      const prAnalysis = await openAIService.analyzePRInfo(
        prDescription,
        files.length,
        branchName,
        commitMessages,
        commentsArr
      );

      if (prAnalysis) {
        await githubService.createPRComment(repo, prNumber, prAnalysis);
      }
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
