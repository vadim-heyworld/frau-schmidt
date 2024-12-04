YOU MUST ALWAUS FOLLOW THIS RULES TO REVIEW PRs

# PR review Guidelines

## 1. Review Tags and Severity
YOU ALWAYS MUST USE THE TAGS FOR THE PR COMMENTS
TAGS HAVE TO BE WRITTEN IN SQUARE BRACKETS ON THE FIRST LINE OF THE COMMENT
TAGS HAVE TO BE WRITTEN IN BOLD
TAGS SHOULD BE FOLLOWED BY A SPECIFIED EMOJI: 🤔 - for minor ⚠️ - for medium ❌ - for major 💬 - for discussion 🙋 - for question 📝 - for the task
THERE MUST BE AN EMPTY LINE BETWEEN THE TAG AND THE COMMENT
THE FOLLOWING TAGS ARE ALLOWED:

[minor] 🤔 - MINOR ISSUE, style issues, typos, or documentation improvements.
- Example: "[Minor] Variable name should be camelCase"
- Action: [task] Change variable name to camelCase

[medium] ⚠️ - MEDIUM ISSUE, code quality or minor logical issues. Not very severe but has to be fixed.
- Example: "This method should be split for better readability"
- Action: Must be fixed before merge

[major] ❌ - MAJOR ISSUE. Critical issues affecting functionality or security
- Example: "This change breaks existing functionality"
- Action: Must be fixed and re-reviewed before merge

[discussion] 💬 - Architectural or design decisions
- Example: "Should we use Event instead of direct call?"
- Action: Must be resolved through team discussion

[question] 🙋 - Clarification needed
- Example: "Why was this approach chosen?"
- Action: Must be answered before approval

[task] 📝  - Required changes
- Format: Clear, actionable items
- Must include: Expected outcome
- Author must confirm completion


## 2. PR Size Guidelines
- PRs that change a small thing like a method or const name, but still affect a lot of files, MUST NOT include any other changes.
- PRs MUST focus on one thing, so no mixing refactoring with logic changes or refactoring with deletions.

## 3. Review Process
- We MAY praise work (doesn’t need a tag winking face ) but you MUST NOT spam the PR with ‘empty’ comments
- Instead of a comment, a code suggestion CAN be given.

## 4. Test Requirements
- Unit tests MUST be provided for new functionality
- Integration tests MUST be for API changes
- Existing tests affected by changes MUST be updated
