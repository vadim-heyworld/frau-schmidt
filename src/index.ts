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
    // Initialize services
    const { octokit, openai, model } = initializeServices();
    const githubService = new GitHubService(octokit);
    const openAIService = new OpenAIService(openai, model);

    // Get PR context
    const context = github.context;
    if (!context.payload.pull_request) {
      core.setFailed('This action can only be run on pull requests');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    // Get PR details
    const { files, commitId, prDescription, branchName, commitMessages } =
      await githubService.getPRDetails(repo, prNumber);

    // Analyze PR info
    const prAnalysis = await openAIService.analyzePRInfo(
      prDescription,
      files.length,
      branchName,
      commitMessages
    );

    if (prAnalysis) {
      await githubService.createPRComment(repo, prNumber, prAnalysis);
    }

    // Process each file
    const projectPrompts = readProjectPrompts(core.getInput('project-name'));

    for (const file of files) {
      const fileChange = processFileChange(file);
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
