import * as core from '@actions/core';
import { OpenAI } from 'openai';

import { CommentThread, FileChange, PRDetails, ReviewComment } from '../types/index.js';

export class OpenAIService {
  private readonly model: string;
  private readonly openai: OpenAI;

  constructor(openAI: OpenAI, model: string) {
    this.model = model;
    this.openai = openAI;
  }

  async analyzePRChanges(fileChange: FileChange, projectPrompts: string): Promise<ReviewComment[]> {
    const diffDescription = [
      ...fileChange.deletions.map(del => `-[${del.position}] ${del.content}`),
      ...fileChange.additions.map(add => `+[${add.position}] ${add.content}`),
    ].join('\n');

    core.info(`Analyzing file: ${fileChange.filename}`);
    core.info(`Changes:\n${diffDescription}`);

    core.info(
      `File: ${fileChange.filename}\n\n${
        fileChange.fullContent
          ? 'TAKE THE FULL FILE CONTENT INTO COSIDERATION FOR THE LOGIC PURPOSES:\n' +
            fileChange.fullContent +
            '\n\n'
          : ''
      } REVIEW ONLY THESE FILE CHANGES:\n${diffDescription}`
    );
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.projectPrompt(projectPrompts),
        },
        {
          role: 'user',
          content: `
          File: ${fileChange.filename}\n\n${
            fileChange.fullContent
              ? 'TAKE THE FULL FILE CONTENT INTO COSIDERATION FOR THE LOGIC PURPOSES:\n' +
                fileChange.fullContent +
                '\n\n'
              : ''
          } REVIEW ONLY THESE FILE CHANGES:\n${diffDescription}`,
        },
      ],
      temperature: 0.0, // 1.0 by default, 0.0 is more deterministic
    });

    return this.parseResponse(response.choices[0].message.content || '', fileChange);
  }

  async analyzePRInfo(prDetails: PRDetails, commentsArr: ReviewComment[]): Promise<string> {
    const prDescription = prDetails.prDescription;
    const fileCount = prDetails.files?.length || 0;
    const branchName = prDetails.branchName;
    const commitMessages = prDetails.commits.map(c => c.commit.message);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.summaryPrompt(),
        },
        {
          role: 'user',
          content: `
          PR Description:
          ${prDescription}
          Number of files changed: ${fileCount}
          Branch name: ${branchName}
          Commit messages: ${commitMessages.join(', ')}
          Your comments splitted by two empty lines: ${commentsArr.map(comment => comment.body).join('\n\n')}
          `,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }

  async analyzeReply(thread: CommentThread, projectPrompts?: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.replyPrompt(
            thread.commentLine,
            thread.diffHunks.map(hunk => hunk.content).join('\n'),
            thread.comments.map(comment => `@${comment.userLogin} commented: ${comment.body}`),
            projectPrompts
          ),
        },
        {
          role: 'user',
          content: `${thread.triggerComment.userLogin} is asking: ${thread.triggerComment.body}`,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }

  private replyPrompt(
    lineContent: string,
    diffContext: string,
    comments: string[],
    projectPrompts?: string
  ): string {
    return `
        You are a helpful and professional code reviewer lady 150 years old responding to a comment from one of our developers.

        Context:
        - Original line of code where the initial comment was done on: ${lineContent}
        - Diff context: ${diffContext}
        - Comments on this thread in DESCENDING order: ${comments.join('\n')}
        ${projectPrompts ? `\nProject Guidelines:\n${projectPrompts}` : ''}

        #INSTRUCTIONS#
        You MUST:
        - Be concise and specific in your response
        - Address the user's concerns directly
        - Provide clear explanations
        - Stay focused on the technical aspects
        - Be professional and constructive
        - Provide concrete examples when needed
        - ALWAYS Use emojis to convey tone when appropriate (✅ - DO, (positive, correct code example), ❌ - DON'T (negative, wrong code example), ⚠️ - WARNING, 📝 - NOTE, 🙋 - QUESTION. 🤔 - SUGGESTION)
        - Consider whether the user is the PR author or another reviewer and adjust your tone accordingly
        - Check that your initial comment was correct, sometimes you do make mistakes

        You MUST NOT:
        - Be rude or dismissive
        - Provide incorrect information
        - Stray from the original context
        - Make assumptions about code not shown
        - Treat all users differently in terms of technical accuracy
      `;
  }

  private projectPrompt(projectPrompts: string): string {
    return `
      You are the most clever and intelligent developer lady 150 years old(who still believes that PHP is the best programming language in the world)  in our team who ALWAYS follows all the provided guidelines and rules.
      Review the given changes and follow the following instructions:

      #INSTRUCTIONS#
      You:
      - MUST ANALYZE AND FLAG EVERY SINGLE VIOLATION of the guidelines provided in:\n${projectPrompts}
      - MUST NOT IGNORE any of the provided guidelines!
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
      5. MUST NOT provide unnecessary information
      6. MUST use emojis to convey tone when appropriate (✅ - DO, (positive), ❌ - DON'T (negative), ⚠️ - WARNING, 📝 - NOTE, 🙋 - QUESTION. 🤔 - SUGGESTION)
      `;
  }

  private summaryPrompt(): string {
    return `
      You are an expert code reviewer lady 150 years old. Analyze the given PR description and stats. Your comment HAS to be informative but short as possible.

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
      - Use emojis to convey tone when appropriate (✅ - DO, (positive), ❌ - DON'T (negative), ⚠️ - WARNING, 📝 - NOTE, 🙋 - QUESTION. 🤔 - SUGGESTION)

      You also MUST create a summary of your comments which you made during the review.
      If the review contains mostly comments tagged as [minor] or [question], and the overall quality of the PR is good, make sure to praise the author for their work.
      However, if the review includes several comments tagged as [medium] or [major], emphasize the importance of maintaining high standards in code writing
      and PR preparation, and encourage the author to be more attentive in their work
    `;
  }

  private parseResponse(content: string, fileChange: FileChange): ReviewComment[] {
    return content
      .split('\n')
      .map(line => {
        const match = line.match(/^\[(\d+)\]:\s(.+)$/);
        if (match) {
          const responsePosition = parseInt(match[1]);
          const isValidLine = fileChange.additions.some(
            addition => addition.position === responsePosition
          );

          if (isValidLine) {
            return { position: responsePosition, body: match[2], path: fileChange.filename };
          }
        }
        return null;
      })
      .filter((comment): comment is ReviewComment => comment !== null);
  }
}
