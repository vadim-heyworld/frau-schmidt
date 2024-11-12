import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
export interface FileChange {
    filename: string;
    patch: string;
    additions: {
        content: string;
        lineNumber: number;
    }[];
    deletions: {
        content: string;
        lineNumber: number;
    }[];
    hunks: DiffHunk[];
    fullContent?: string;
}
export interface DiffHunk {
    content: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    changes: DiffChange[];
}
export interface DiffChange {
    type: 'add' | 'del' | 'context';
    content: string;
    lineNumber: number;
}
export interface ReviewComment {
    line: number;
    comment: string;
}
type PullRequestResponse = RestEndpointMethodTypes['pulls']['get']['response']['data'];
type PullRequestCommit = RestEndpointMethodTypes['pulls']['listCommits']['response']['data'][0];
export type PullRequestFile = RestEndpointMethodTypes['pulls']['listFiles']['response']['data'][0];
export interface PRDetails {
    pullRequest: PullRequestResponse;
    commits: PullRequestCommit[];
    files: PullRequestFile[];
    commitId: string;
    prDescription: string;
    branchName: string;
    commitMessages: string[];
}
export interface CommentContext {
    lineContent: string;
    diffContext: string;
}
export interface CommentReply {
    replyComment: {
        id: number;
        body: string;
        user: {
            login: string;
        };
        path: string;
        line: number;
        original_line?: number;
    };
    originalComment: {
        id: number;
        body: string;
        user: {
            login: string;
        };
    };
    commentContext: CommentContext;
    userLogin: string;
    isPRAuthor: boolean;
}
export {};
//# sourceMappingURL=index.d.ts.map