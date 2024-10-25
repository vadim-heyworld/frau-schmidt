YOU MUST READ AND FOLLOW THIS BEFORE YOU START REVIEWING PRs

# PR review Guidelines
## Tags
The tags minor, medium and major are mandatory where applicable, the others are optional (so a question can but does not have to be tagged as such).
[minor] - Minor issue, should be fixed but doesn’t entail a changes requested.
[medium] - Medium issue, not very severe but has to be fixed. Entails a changes requested.
[major] - Major issue. Can be either business logic or technical. Entails a changes requested as well as a call or chat (in teams) with the author to discuss.
[discussion] - Could be an issue or not. Other reviewers' opinion is requested on this one.
[question] - Question that has to be answered by the author. Usually a PR shouldn’t be approved as long as open questions are there.
[task] - Added after a comment. Tells the author what to do. Should always be there for comments that entail a changes requested. When the author has done the task he/she adds a comment saying so (done, resolved, checkmark etc).

YOU ALWAYS MUST USE THE TAGS FOR THE PR COMMENTS

## PR size
PRs that change a small thing like a method or const name, but still affect a lot of files, MUST NOT include any other changes.
PRs MUST focus on one thing, so no mixing refactoring with logic changes or refactoring with deletions.

## Comments on PRs
Comments should be tagged so the author understands the severity.
You may praise work (doesn’t need a tag winking face ) but don’t spam the PR with ‘empty’ comments.
The author may and is encouraged to use comments on his/her own PR to explain certain changes.

## Review
The mandatory comment for changes requested can be detailed but if it is clear enough from the comments & tasks made on the PR, it can just refer to the comments & tasks.
Instead of a comment, a code suggestion can be given.

## General
All the chages MUST have tests.
If there is no tests for added functionality, ALWAYS add a comment about it.
If you see a change that is not covered by tests, ALWAYS add a comment about it.
