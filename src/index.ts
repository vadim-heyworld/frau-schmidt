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
    const { octokit, openai, model } = initializeServices();
    const githubService = new GitHubService(octokit);
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

      const prAnalysis = await openAIService.analyzePRInfo(
        prDescription,
        files.length,
        branchName,
        commitMessages
      );

      if (prAnalysis) {
        await githubService.createPRComment(repo, prNumber, prAnalysis);
      }

      const projectPrompts = readProjectPrompts(core.getInput('project-name'));

      for (const file of files) {
        const fileChange = processFileChange(file);
        if (fullScan) {
          const fileContent = await githubService.getFileContent(repo, file.filename, commitId);
          if (fileContent) {
            fileChange.fullContent = fileContent;
          }
        }

        const comments = await openAIService.analyzePRChanges(fileChange, projectPrompts);

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
    }

    if (context.eventName === 'pull_request_review_comment' && enableReplies) {
      const comment = context.payload.comment;
      if (!comment?.body || !comment.body.includes('@frau-schmidt')) {
        return;
      }
      const projectPrompts = includeProjectPromptsInReplies
        ? readProjectPrompts(core.getInput('project-name'))
        : undefined;

      const replies = await githubService.getCommentReplies(repo, prNumber, 'frau-schmidt');

      for (const reply of replies) {
        const response = await openAIService.analyzeReply(reply, projectPrompts);

        await githubService.replyToComment(
          repo,
          prNumber,
          reply.replyComment.id,
          response,
          reply.userLogin
        );

        core.info(
          `Replied to ${reply.isPRAuthor ? 'PR author' : 'reviewer'} @${reply.userLogin} on comment ${reply.replyComment.id}`
        );
      }
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
