import { build, context } from 'esbuild';
import { copy } from "esbuild-plugin-copy"

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

const buildOptions = {
  entryPoints: ["./src/main/index.ts"],
  bundle: true,
  platform: 'node',
  target: 'esnext',
  outdir: "./dist",
  format: 'esm',
  sourcemap: !isMinify,
  minify: isMinify,
  external: ['electron'],
  plugins: [
    // Copy static asset files
    copy({
      resolveFrom: 'cwd',
      assets: [{ from: ['./src/main/assets/**/*'], to: ['./dist/assets'] }],
      verbose: true,
      once: !isWatch
    })
  ]
};

if (isWatch) {
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes…');
} else {
  await build(buildOptions);
  console.log('Build complete');
}
