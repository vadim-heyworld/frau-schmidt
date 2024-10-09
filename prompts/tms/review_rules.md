# PR review Guidelines
## Tags
To make it more clear what a comment is about and how important it is, we add tags to comments. The commonly used tags are (please try to refrain from using any other tags).
The tags minor, medium and major are mandatory where applicable, the others are optional (so a question can but does not have to be tagged as such).
[minor] - Minor issue, should be fixed but doesn’t entail a changes requested.
[medium] - Medium issue, not very severe but has to be fixed. Entails a changes requested.
[major] - Major issue. Can be either business logic or technical. Entails a changes requested as well as a call or chat (in teams) with the author to discuss.
[discussion] - Could be an issue or not. Other reviewers' opinion is requested on this one.
[question] - Question that has to be answered by the author. Usually a PR shouldn’t be approved as long as open questions are there.
[task] - Added after a comment. Tells the author what to do. Should always be there for comments that entail a changes requested. When the author has done the task he/she adds a comment saying so (done, resolved, checkmark etc).

## PR size
PRs may not be larger than 30 files. Optimally they include no more than 20 files. Should a PR require more files to be changed then a reason has to be given as well as still trying to keep the PR as small as possible.
PRs that change a small thing like a method or const name, but still affect a lot of files, should not include any other changes.
PRs should focus on one thing, so no mixing refactoring with logic changes or refactoring with deletions.

## Comments on PRs
PRs should not get to the point where they have 50+ comments. Comments should be tagged so the author understands the severity.
You may praise work (doesn’t need a tag winking face ) but don’t spam the PR with ‘empty’ comments.
The author may and is encouraged to use comments on his/her own PR to explain certain changes.
If a comment is not clear to the author, he/she should ask the commenter via teams.

## Review
A review is always finished by either approving or requesting changes. If somebody only leaves comments but no conclusion, this is no review.
The mandatory comment for changes requested can be detailed but if it is clear enough from the comments & tasks made on the PR, it can just refer to the comments & tasks.
Instead of a comment, a code suggestion can be given.
Do not use the request review feature to clear previous reviews. That makes it harder to follow who reviewed the PR and with what result.
As author, give the reviewer some time to finish the review before you push changes, otherwise the reviewer continuously has to check what was just pushed.

## General
If a PR has [major] comments and as a result needs a major re-work, decline the PR, do the re-work and then put the PR up again.
Draft/WIP PRs can be reviewed, but don’t have to be. If an author of a draft/WIP PR doesn’t want it to be reviewed he/she should add a label signifying this (label has to be determined).
When an author splits his/her work into several PRs, then the branches should be based on each other, i.e. the first branch is based on develop, the second is based on the first and so on. This is to avoid having changes that were made in a previous PR be also shown in the following PR.
