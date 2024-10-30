import { Octokit } from '@octokit/rest';
import { PRDetails } from '../types/index.js';
export declare class GitHubService {
    private readonly octokit;
    constructor(octokit: Octokit);
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
}
//# sourceMappingURL=gitHub.d.ts.map