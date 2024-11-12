# AI PR Review GitHub Action

This GitHub Action performs an AI-powered code review on pull requests using OpenAI's GPT-4 and Anthropic's Claude models. It provides intelligent, context-aware feedback on your code changes, helping to improve code quality and catch potential issues early in the development process.

## Features

- Automated code review using AI models
- Project-specific review guidelines
- Multi-file PR support
- Inline comments on specific code changes
- Replying to review comments that mention the bot
- Possibility to include the whole context of the PR in the review

## Setup

### 1. Clone the repository

### 2. Install dependencies

Run the following command to install the necessary dependencies:

```bash
npm install
```

### 3. Build the action

Run:

```bash
npm run build
```

This will compile your TypeScript code and bundle it into a single file in the `dist` directory.

### 4. Create a release

Commit your changes, push to GitHub, and create a new release in your repository.

## Usage

To use this action in your repositories, create a new workflow file (e.g., `.github/workflows/ai-pr-review.yml`) with the following content:

```yaml
name: AI PR Review
on:
  pull_request:
    types: [opened, synchronize]
  pull_request_review_comment:
    types: [created]

jobs:
  review:
    runs-on: ubuntu-latest
    if: |
      (github.event_name == 'pull_request') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@frau-schmidt'))
    steps:
      - uses: actions/checkout@v4
      - name: AI PR Review
        uses: heyworldgmbh/pr-review-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          project-name: ${{ github.event.repository.name }} # CAN be replaced with a static name of the prompts subdir, e.g. 'my-project'
          openai-model: 'gpt-4o-mini'
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}
          installation-id: ${{ secrets.APP_INSTALLATION_ID }}
          full-scan: 'false|true'
          enable-replies: 'false|true'
          include-project-prompts-in-replies: 'false|true'
```


### Setting up secrets

In the repository settings where you're using this action, go to "Secrets and variables" > "Actions" and add the following secrets:
- `OPENAI_API_KEY`: The OpenAI API key
- `APP_ID`: The GitHub App ID
- `APP_PRIVATE_KEY`: The GitHub App private key
- `APP_INSTALLATION_ID`: The GitHub App installation ID, that can be found in the URL of the GitHub App settings page

## Customization

### Project-specific prompts

You can customize the AI's review guidelines for each project.
Create a `prompts` directory in your action repository with the following structure:

```
prompts/
├── project1/
│   ├── 1_code-style.md
│   └── 2_pr-rules.md
└── project2/
    ├── 1_code-style.md
    └── 2_pr-rules.md
```

You can name the files anything you like, but make it descriptive for your project and it is a part of the prompt.
The content of these files will be included in the AI's prompt, allowing you to specify project-specific coding standards, PR guidelines, or any other relevant information.

### Modifying the AI prompt
To change the base prompt or how project-specific prompts are incorporated, modify the `analyzePRChanges`, `analyzeReply` and `analyzePRInfo` functions in `src/services/openAI.ts`.

## Contributing

Contributions to improve the AI PR Review Action are welcome! Please feel free to submit issues or pull requests.

## Disclaimer

This action uses API services from OpenAI, which may incur costs. Please be aware of your usage and the associated costs when using this action.
