import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

export interface FileChange {
  filename: string;
  patch: string;
  additions: string[];
  deletions: string[];
  hunks: DiffHunk[];
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
