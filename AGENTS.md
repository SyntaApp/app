# AGENTS Instructions

This guide explains Synta's environment and contribution rules. Read it fully before contributing so your changes integrate smoothly.

## Overview
- Bun manages dependencies and runs scripts.
- The Electron main process is built with esbuild.
- The renderer uses Vite and React, compiled with SWC for speed.

## Environment Setup
1. Install Bun from https://bun.sh if it is not already installed.
2. Install project dependencies:
   ```bash
   bun install
   ```

## Development Workflow
- Start local development:
  ```bash
  bun dev
  ```
  This builds the main process, launches the renderer, and starts Electron.
- Build only the main process:
  ```bash
  bun mp:build
  ```
  Use `bun mp:build:watch` to rebuild on changes.
- Build the renderer for production:
  ```bash
  bun renderer:build
  ```
- Run the app directly:
  ```bash
  bun start
  ```
- Run tests (always run before committing, even if no tests are present):
  ```bash
  bun test
  ```

## Conventions
- Use TypeScript and follow the existing code style.
- Commit messages **must** follow the Conventional Commits format, e.g., `feat: add feature` or `fix: resolve issue`.
- Keep commits focused and update documentation when behavior changes.
- Run `bun test` and other relevant checks before submitting a pull request.

## Do's and Don'ts
### Do
- Read and follow this guide before making changes.
- Use Bun for all scripts and dependency management.
- Ensure tests and builds pass before opening a PR.

### Don't
- Commit directly to the `main` branch.
- Skip tests or other checks.
- Introduce unrelated changes or dependencies without prior discussion.

