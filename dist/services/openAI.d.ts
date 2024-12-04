import { OpenAI } from 'openai';
import { CommentThread, FileChange, PRDetails, ReviewComment } from '../types/index.js';
export declare class OpenAIService {
    private readonly model;
    private readonly openai;
    constructor(openAI: OpenAI, model: string);
    analyzePRChanges(fileChange: FileChange, projectPrompts: string): Promise<ReviewComment[]>;
    analyzePRInfo(prDetails: PRDetails, commentsArr: ReviewComment[]): Promise<string>;
    analyzeReply(thread: CommentThread, projectPrompts?: string): Promise<string>;
    private replyPrompt;
    private projectPrompt;
    private summaryPrompt;
    private parseResponse;
}
//# sourceMappingURL=openai.d.ts.map