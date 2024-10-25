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

    const { data: files } = await octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: prNumber,
    });

    const prompts = readProjectPrompts(projectName);

    for (const file of files) {
      const fileChange: FileChange = {
        filename: file.filename,
        patch: file.patch || "",
      };

      const openaiAnalysis = await analyzeWithOpenAI(
        openai,
        openAIModel,
        fileChange,
        prompts,
      );

      if (openaiAnalysis) {
        await createReviewComment(
          octokit,
          repo,
          prNumber,
          commitId,
          file.filename,
          openaiAnalysis,
          file.patch || "",
        );
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

async function analyzeWithOpenAI(
  openai: OpenAI,
  openAIModel: string,
  fileChange: FileChange,
  projectPrompts: string,
): Promise<string> {
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
        - DENIED to overlook the critical context
        - MUST ALWAYS follow #Answering rules#
        - MUST ALWAYS be short and to the point
        - MUST put a short conclusion at the end with a score from 1 to 10

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

  return response.choices[0].message.content || "";
}

async function createReviewComment(
  octokit: Octokit,
  repo: { owner: string; repo: string },
  prNumber: number,
  commitId: string,
  path: string,
  body: string,
  diff: string,
) {
  const position = diff.split("\n").length - 1;

  await octokit.rest.pulls.createReviewComment({
    ...repo,
    pull_number: prNumber,
    commit_id: commitId,
    body,
    path,
    position,
  });
}

run();
