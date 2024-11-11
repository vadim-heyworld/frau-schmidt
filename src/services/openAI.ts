import * as core from '@actions/core';
import { OpenAI } from 'openai';

import { FileChange, ReviewComment } from '../types/index.js';

export class OpenAIService {
  private readonly model: string;
  private readonly openai: OpenAI;

  constructor(openAI: OpenAI, model: string) {
    this.model = model;
    this.openai = openAI;
  }

  async analyzePRChanges(fileChange: FileChange, projectPrompts: string): Promise<ReviewComment[]> {
    const diffDescription = [
      ...fileChange.deletions.map(del => `-[${del.lineNumber}] ${del.content}`),
      ...fileChange.additions.map(add => `+[${add.lineNumber}] ${add.content}`),
    ].join('\n');

    core.info(`Analyzing file: ${fileChange.filename}`);
    core.info(`Changes:\n${diffDescription}`);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(projectPrompts),
        },
        {
          role: 'user',
          content: `File: ${fileChange.filename}\n\n${
            fileChange.fullContent ? 'Full file content:\n' + fileChange.fullContent + '\n\n' : ''
          }Changes:\n${diffDescription}`,
        },
      ],
    });

    return this.parseResponse(response.choices[0].message.content || '', fileChange);
  }

  async analyzePRInfo(
    prDescription: string,
    fileCount: number,
    branchName: string,
    commitMessages: string[]
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.buildPRInfoPrompt(),
        },
        {
          role: 'user',
          content: `
          PR Description:
          ${prDescription}
          Number of files changed: ${fileCount}
          Branch name: ${branchName}
          Commit messages: ${commitMessages.join(', ')}
          You MUST analyze the PR description and file count based on the provided guidelines.
          `,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }

  private buildSystemPrompt(projectPrompts: string): string {
    return `
      You are the most clever and intelligent developer in our team who ALWAYS follows all the provided guidelines and rules.
      Review the given changes and follow the following instructions:

      #INSTRUCTIONS#
      You:
      - MUST ANALYZE AND FLAG EVERY SINGLE VIOLATION of the guidelines provided in:\n${projectPrompts}
      - MUST NEVER HALLUCINATE
      - MUST NOT SKIP OR IGNORE any naming convention violations
      - DENIED to overlook the critical context
      - MUST ALWAYS follow #Answering rules#
      - MUST ALWAYS be short and to the point
      - MUST ONLY comment on new or modified lines (lines starting with +)
      - MUST ALWAYS provide comments in the following format:
                [LINE_NUMBER]: Comment text
                [LINE_NUMBER]: Another comment text
      - SHOULD NOT provide unnecessary comments and information
      - MUST reference line numbers from the new file for additions/modifications
      - MUST use the actual line numbers from the diff hunks provided
      - MUST use the full file content when it is provided, to better understand the context and impact of changes
      - MUST consider the surrounding code context when analyzing changes

      #Answering Rules#
      Follow in the strict order, you:
      1. MUST USE the language of my message
      2. MUST NOT tell me about the changes that were made by author, only analyze the changes
      3. MUST combine your deep knowledge of the topic and clear thinking
      4. MUST answer the question in a natural, human-like manner
      5. MUST NOT provide unnecessary information`;
  }

  private buildPRInfoPrompt(): string {
    return `
      You are an expert code reviewer. Analyze the given PR description and stats. Your comment HAS to be informative but short as possible.
      Follow these guidelines:
      - PR MUST NOT be larger than 30 files.
      - Optimally they SHOULD include no more than 20 files.
      - Branch name MUST follow this naming rule: '<type>/<issue-key>-<description>'
      - Every commit MUST have a prefix with the corresponding issue key
      - PR that change a small thing MUST NOT include any other changes.
      - PR MUST focus on one thing
      - Check if the PR description is adequate
      - You MUST Provide constructive feedback
      - You MUST be concise and specific in your analysis
    `;
  }

  private parseResponse(content: string, fileChange: FileChange): ReviewComment[] {
    return content
      .split('\n')
      .map(line => {
        const match = line.match(/^\[(\d+)\]:\s(.+)$/);
        if (match) {
          const lineNumber = parseInt(match[1]);
          const isValidLine = fileChange.additions.some(
            addition => addition.lineNumber === lineNumber
          );

          if (isValidLine) {
            return { line: lineNumber, comment: match[2] };
          }
        }
        return null;
      })
      .filter((comment): comment is ReviewComment => comment !== null);
  }
}
