import * as core from "@actions/core";
import * as github from "@actions/github";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

interface FileChange {
  filename: string;
  patch: string;
}

async function run() {
  try {
    const appId = parseInt(core.getInput("app-id", { required: true }));
    core.debug(`App-id input: ${appId}`);
    if (isNaN(appId)) {
      throw new Error(
        `app-id must be a valid number, but provided the following: ${appId}`,
      );
    }

    const privateKey = core.getInput("private-key", { required: true });
    core.debug(`Private key length: ${privateKey.length}`);

    const installationId = parseInt(
      core.getInput("installation-id", { required: true }),
    );
    core.debug(`Installation-id input: ${installationId}`);
    if (isNaN(installationId)) {
      throw new Error(
        `installation-id must be a valid number, but provided the following: ${installationId}`,
      );
    }

    const openaiApiKey = core.getInput("openai-api-key", { required: true });
    const projectName = core.getInput("project-name", { required: true });
    const openAIModel = core.getInput("openai-model", { required: true });

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: appId,
        privateKey: privateKey,
        installationId: installationId,
      },
    });
    core.debug("Successfully created Octokit instance");

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const context = github.context;

    if (context.payload.pull_request == null) {
      core.setFailed("This action can only be run on pull requests");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    const { data: pullRequest } = await octokit.rest.pulls.get({
      ...repo,
      pull_number: prNumber,
    });

    const commitId = pullRequest.head.sha;
    const prDescription = pullRequest.body || "";
    const branchName = pullRequest.head.ref;

    const { data: commits } = await octokit.rest.pulls.listCommits({
      ...repo,
      pull_number: prNumber,
    });
    const commitMessages = commits.map((commit) => commit.commit.message);

    const { data: files } = await octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: prNumber,
    });

    const fileCount = files.length;

    const prAnalysis = await analyzePRInfo(
      openai,
      openAIModel,
      prDescription,
      fileCount,
      branchName,
      commitMessages,
    );

    if (prAnalysis) {
      await createPRComment(octokit, repo, prNumber, prAnalysis);
    }

    const prompts = readProjectPrompts(projectName);

    for (const file of files) {
      const fileChange: FileChange = {
        filename: file.filename,
        patch: file.patch || "",
      };

      const openaiAnalysis = await analyzePRChanges(
        openai,
        openAIModel,
        fileChange,
        prompts,
      );

      if (openaiAnalysis.length > 0) {
        for (const comment of openaiAnalysis) {
          await createReviewComment(
            octokit,
            repo,
            prNumber,
            commitId,
            file.filename,
            comment.comment,
            comment.line,
          );
        }
      }
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

function readProjectPrompts(projectName: string): string {
  const promptsDir = path.join(__dirname, "..", "prompts", projectName);
  let combinedPrompts = "";

  if (fs.existsSync(promptsDir)) {
    const files = fs.readdirSync(promptsDir);
    for (const file of files) {
      const filePath = path.join(promptsDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      combinedPrompts += `${file}:\n${content}\n\n`;
    }
  }

  core.debug(`Reading prompts from: ${promptsDir}`);

  return combinedPrompts.trim();
}

async function analyzePRChanges(
  openai: OpenAI,
  openAIModel: string,
  fileChange: FileChange,
  projectPrompts: string,
): Promise<Array<{ line: number; comment: string }>> {
  const response = await openai.chat.completions.create({
    model: openAIModel,
    messages: [
      {
        role: "system",
        content: `
        You are the most clever and intelligent developer in our team who ALWAYS follows all the provided guidelines and rules.
        Review the given chages and follow the following instrustions:

        #INSTRUCTIONS#
        You:
        - MUST always follow the guidelines:\n${projectPrompts}
        - MUST NEVER HALLUCINATE
        - MUST NOT bring changes overview, ONLY analyze the changes
        - DENIED to overlook the critical context
        - MUST ALWAYS follow #Answering rules#
        - MUST ALWAYS be short and to the point
        - MUST provide comments in the following format:
                  [LINE_NUMBER]: Comment text
                  [LINE_NUMBER]: Another comment text

        #Answering Rules#
        Follow in the strict order:
        1. USE the language of my message
        2. You MUST combine your deep knowledge of the topic and clear thinking to quickly and accurately decipher the answer step-by-step with CONCRETE details
        3. I'm going to tip $1,000,000 for the best reply
        4. Your answer is critical for my career
        5. Answer the question in a natural, human-like manner
        6. DONT provide unnecessary information
        7. DONT tell me about the changes that were made by author, only analize the changes`,
      },
      {
        role: "user",
        content: `File: ${fileChange.filename}\n\nChanges:\n${fileChange.patch}`,
      },
    ],
  });

  const content = response.choices[0].message.content || "";
  const comments = content
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d+)\]:\s(.+)$/);
      if (match) {
        return { line: parseInt(match[1]), comment: match[2] };
      }
      return null;
    })
    .filter(
      (comment): comment is { line: number; comment: string } =>
        comment !== null,
    );

  return comments;
}

async function analyzePRInfo(
  openai: OpenAI,
  openAIModel: string,
  prDescription: string,
  fileCount: number,
  branchName: string,
  commitMessages: string[],
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: openAIModel,
    messages: [
      {
        role: "system",
        content: `
        You are an expert code reviewer. Analyze the given PR description and stats. Your comment HAS to be informative but short as possible.
        Follow these guidelines:
        - PR MUST NOT be larger than 30 files.
        - Optimally they SHOULD include no more than 20 files.
        - Branch name MUST follow this naming rule: '<type>/<issue-key>-<description>', where type is either 'feature', 'bugfix' or 'other'
        - Every commit MUST have a prefix with the corresponding issue key (exception when there is no ticket for a commit, but you SHOULD point it out in the review)
        - PR that change a small thing like a method or const name, but still affect a lot of files, MUST NOT include any other changes.
        - PR MUST focus on one thing, so no mixing refactoring with logic changes or refactoring with deletions.
        - Check if the PR description is adequate and provides necessary information
        - Provide constructive feedback if improvements are needed, but it should be concise and specific
        - Be concise and specific in your analysis
        `,
      },
      {
        role: "user",
        content: `
        PR Description:
        ${prDescription}
        Number of files changed: ${fileCount}
        Branch name: ${branchName}
        Commit messages: ${commitMessages.join(", ")}
        Please analyze the PR description and file count based on the provided guidelines.
        `,
      },
    ],
  });

  return response.choices[0].message.content || "";
}

async function createReviewComment(
  octokit: Octokit,
  repo: { owner: string; repo: string },
  prNumber: number,
  commitId: string,
  path: string,
  body: string,
  line: number,
) {
  await octokit.rest.pulls.createReviewComment({
    ...repo,
    pull_number: prNumber,
    commit_id: commitId,
    body,
    path,
    line,
  });
}

async function createPRComment(
  octokit: Octokit,
  repo: { owner: string; repo: string },
  prNumber: number,
  body: string,
) {
  await octokit.rest.issues.createComment({
    ...repo,
    issue_number: prNumber,
    body,
  });
}

run();
