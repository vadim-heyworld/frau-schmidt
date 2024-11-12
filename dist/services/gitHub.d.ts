import { Octokit } from '@octokit/rest';
import { CommentReply, PRDetails } from '../types/index.js';
export declare class GitHubService {
    private readonly octokit;
    constructor(octokit: Octokit);
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
    getCommentReplies(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, botUsername: string): Promise<CommentReply[]>;
    replyToComment(repo: {
        owner: string;
        repo: string;
    }, prNumber: number, inReplyToId: number, body: string, userLogin: string): Promise<void>;
    private getDiffContext;
    private getLineContent;
}
//# sourceMappingURL=gitHub.d.ts.map