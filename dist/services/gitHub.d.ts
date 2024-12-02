import { Octokit } from '@octokit/rest';
import { CommentThread, Comment, PRDetails } from '../types/index.js';
export declare class GitHubService {
    private readonly octokit;
    private readonly botUsername;
    constructor(octokit: Octokit, botUsername: string);
    getFileContent(repo: {
        owner: string;
        repo: string;
    }, path: string, ref: string): Promise<string | null>;
    createReviewComment(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, commitId: string, path: string, body: string, line: number): Promise<void>;
    createPRComment(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, body: string): Promise<void>;
    getPRDetails(repo: {
        owner: string;
        repo: string;
    }, prNumber: number): Promise<PRDetails>;
    getCommentThread(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, triggerComment: Comment): Promise<CommentThread>;
    replyToComment(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, inReplyToId: number, replyToUser: string, replyBody: string): Promise<void>;
    private getLineContent;
}
//# sourceMappingURL=github.d.ts.map