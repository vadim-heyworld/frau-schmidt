import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import * as core from '@actions/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function readProjectPrompts(projectName: string): string {
  const promptsDir = path.join(__dirname, '..', '..', 'prompts', projectName);
  let combinedPrompts = '';

  if (fs.existsSync(promptsDir)) {
    const files = fs.readdirSync(promptsDir);
    for (const file of files) {
      const filePath = path.join(promptsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      combinedPrompts += `${file}:\n${content}\n\n`;
    }
  }

  core.debug(`Reading prompts from: ${promptsDir}`);
  return combinedPrompts.trim();
}
