import { OpenAI } from 'openai';
import { FileChange, ReviewComment } from '../types/index.js';
export declare class OpenAIService {
    private readonly model;
    private readonly openai;
    constructor(openAI: OpenAI, model: string);
    analyzePRChanges(fileChange: FileChange, projectPrompts: string): Promise<ReviewComment[]>;
    analyzePRInfo(prDescription: string, fileCount: number, branchName: string, commitMessages: string[]): Promise<string>;
    private buildSystemPrompt;
    private buildPRInfoPrompt;
    private parseResponse;
}
//# sourceMappingURL=openAI.d.ts.map