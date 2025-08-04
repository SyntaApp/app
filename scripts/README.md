# Scripts Directory

This directory contains local development scripts designed to make working on Synta easier and more efficient.

## Overview

These scripts are written in TypeScript and executed directly with Bun's transpiler, eliminating the need for compilation. They provide developer utilities that streamline common development tasks.

## Scripts

### `js/path.ts` - Path Management CLI

A CLI tool for managing TypeScript file paths in both `package.json` and `tsconfig.json`.

**Usage:**
```bash
bun run path <ts-file> <name>
```

**Example:**
```bash
bun run path src/components/Button.tsx Button
```

**What it does:**
- Validates TypeScript file existence and extension
- Adds export mapping to `package.json`
- Adds path mapping to `tsconfig.json`
- Enables cleaner imports: `import { Button } from 'Button'` instead of relative paths


## Adding New Scripts

When adding new scripts:

1. Place them in the appropriate subdirectory (e.g., `js/` for TypeScript scripts)
2. Add a corresponding npm script in `package.json` for easy access under the `scripts` action
3. Document the script's purpose and usage
4. Follow the existing error handling and feedback patterns