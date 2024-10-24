import * as core from "@actions/core";
import * as github from "@actions/github";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";
import { createAppAuth } from "@octokit/auth-app";

interface FileChange {
  filename: string;
  patch: string;
}

async function run() {
  try {
    const appId = core.getInput("app-id", { required: true });
    const privateKey = core.getInput("private-key", { required: true });
    const installationId = core.getInput("installation-id", { required: true });
    const openaiApiKey = core.getInput("openai-api-key", { required: true });
    const projectName = core.getInput("project-name", { required: true });
    const openAIModel = core.getInput("openai-model", { required: true });

    const octokit = github.getOctokit("", {
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId: Number(installationId),
      },
    });
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const context = github.context;

    if (context.payload.pull_request == null) {
      core.setFailed("This action can only be run on pull requests");
      return;
    }

    // Extract PR number and repo
    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    const { data: pullRequest } = await octokit.rest.pulls.get({
      ...repo,
      pull_number: prNumber,
    });

    // Get the commit ID which we need in order to make a review comment
    const commitId = pullRequest.head.sha;

    // Fetch PR files
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
        You are the most clever and intelligent code reviewer in the world.
        I need your help to review the following code changes.
        Please provide me with a detailed but short analysis of the changes and suggest improvements.

        #INSTRUCTIONS#
        You MUST ALWAYS:
        - Answer in the language of my message
        - You will be PENALIZED for wrong answers
        - NEVER HALLUCINATE
        - You DENIED to overlook the critical context
        - ALWAYS follow #Answering rules#
        - Answer MUST be short and concise

        #Answering Rules#
        Follow in the strict order:
        1. USE the language of my message
        2. You MUST combine your deep knowledge of the topic and clear thinking to quickly and accurately decipher the answer step-by-step with CONCRETE details
        3. I'm going to tip $1,000,000 for the best reply
        4. Your answer is critical for my career
        5. Answer the question in a natural, human-like manner
        6. You MUST ALWAYS follow the following guidelines:\n\n${projectPrompts}`,
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
  octokit: ReturnType<typeof github.getOctokit>,
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
