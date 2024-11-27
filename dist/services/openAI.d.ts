import { OpenAI } from 'openai';
import { CommentThread, FileChange, ReviewComment } from '../types/index.js';
export declare class OpenAIService {
    private readonly model;
    private readonly openai;
    constructor(openAI: OpenAI, model: string);
    analyzePRChanges(fileChange: FileChange, projectPrompts: string): Promise<ReviewComment[]>;
    analyzePRInfo(prDescription: string, fileCount: number, branchName: string, commitMessages: string[]): Promise<string>;
    analyzeReply(thread: CommentThread, projectPrompts?: string): Promise<string>;
    private buildReplyPrompt;
    private buildSystemPrompt;
    private buildPRInfoPrompt;
    private parseResponse;
}
//# sourceMappingURL=openAI.d.ts.map