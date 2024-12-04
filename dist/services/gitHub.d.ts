import { Octokit } from '@octokit/rest';
import { CommentThread, Comment, PRDetails, ReviewComment } from '../types/index.js';
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
    submitReview(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, comments: ReviewComment[], summary: string): Promise<void>;
    getPRDetails(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, lastReviewedSha: string | null): Promise<PRDetails | null>;
    getCommentThread(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, triggerComment: Comment): Promise<CommentThread>;
    replyToComment(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, inReplyToId: number, replyToUser: string, replyBody: string): Promise<void>;
    getLastReviewedCommitSha(repo: {
        owner: string;
        repo: string;
    }, prNumber: number): Promise<string | null>;
    private getLineContent;
}
//# sourceMappingURL=github.d.ts.map