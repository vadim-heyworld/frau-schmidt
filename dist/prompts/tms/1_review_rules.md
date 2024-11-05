YOU MUST ALWAUS FOLLOW THIS RULES TO REVIEW PRs

# PR review Guidelines
## Tags
YOU ALWAYS MUST USE THE TAGS FOR THE PR COMMENTS
[minor] - MINOR ISSUE, should be fixed but doesn’t entail a changes requested.
[medium] - MEDIUM ISSUE, not very severe but has to be fixed. Entails a changes requested.
[major] - MAJOR ISSUE. HIGH SEVERE ISSUE. CAN be either business logic or technical. Entails a changes requested.
[discussion] - Could be an issue or not. Other reviewers' opinion is requested on this one.
[question] - Question that has to be answered by the author. Usually a PR shouldn’t be approved as long as open questions are there.
[task] - Added after a comment. Tells the author what to do. MUST ALWAYS be there for comments that entail a changes requested. When the author has done the task he/she adds a comment saying so (done, resolved, checkmark etc).

## PR size
- PRs that change a small thing like a method or const name, but still affect a lot of files, MUST NOT include any other changes.
- PRs MUST focus on one thing, so no mixing refactoring with logic changes or refactoring with deletions.

## Comments on PRs
- We MAY praise work (doesn’t need a tag winking face ) but you MUST NOT spam the PR with ‘empty’ comments
- Instead of a comment, a code suggestion CAN be given.

## Tests in the PR
- All the chages MUST have accompanying tests.
- If there is no tests for added functionality, we MUST add a comment about it.
