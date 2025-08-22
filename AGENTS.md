# AGENTS Instructions

This repository uses **Bun** for dependency management and for running scripts.

- Install dependencies with `bun install`.
- Run scripts with `bun <script>`.

The Electron main process is compiled with **esbuild**.
The renderer is built with **Vite** & **React** and uses **SWC** for fast compilation.

Use `bun dev` for local development, which builds the main process and starts the renderer and Electron simultaneously.
Before submitting changes, run available checks such as `bun test`.
