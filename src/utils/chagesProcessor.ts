import { DiffHunk, FileChange, PullRequestFile } from '../types/index.js';

export function parsePatch(patch: string): DiffHunk[] {
  if (!patch) return [];

  const hunks: DiffHunk[] = [];
  const headerRegex = /^@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/;

  let index = -1;
  let position = 0;

  patch.split('\n').forEach(line => {
    if (line.startsWith('@@')) {
      const match = line.match(headerRegex);
      if (match) {
        const [, oldStart, oldLines = '1', newStart, newLines = '1'] = match;
        hunks.push({
          content: '',
          oldStart: parseInt(oldStart),
          oldLines: parseInt(oldLines),
          newStart: parseInt(newStart),
          newLines: parseInt(newLines),
          changes: [],
        });
        index += 1;
      }
    } else if (hunks.length > 0) {
      const hunk = hunks[index];
      hunk.content += line + '\n';

      position += 1;

      if (line.startsWith('+')) {
        hunk.changes.push({
          type: 'add',
          content: line.substring(1),
          position: position,
        });
      } else if (line.startsWith('-')) {
        hunk.changes.push({
          type: 'del',
          content: line.substring(1),
          position: position,
        });
      } else if (line.length > 0 && !line.startsWith('\\')) {
        hunk.changes.push({
          type: 'context',
          content: line.substring(1),
          position: position,
        });
      }
    }
  });

  return hunks;
}

export function processFileChange(file: PullRequestFile): FileChange {
  const hunks = parsePatch(file.patch || '');
  const additions: { content: string; position: number }[] = [];
  const deletions: { content: string; position: number }[] = [];

  hunks.forEach(hunk => {
    hunk.changes.forEach(change => {
      if (change.type === 'add') {
        additions.push({
          content: change.content,
          position: change.position,
        });
      } else if (change.type === 'del') {
        deletions.push({
          content: change.content,
          position: change.position,
        });
      }
    });
  });

  return {
    filename: file.filename,
    patch: file.patch || '',
    additions,
    deletions,
    hunks,
  };
}
