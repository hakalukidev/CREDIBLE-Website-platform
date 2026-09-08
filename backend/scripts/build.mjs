// Bundles the API and worker entrypoints with esbuild.
//
// tsc alone can't produce runnable output here: Node's ESM loader requires
// explicit .js extensions on relative imports (this codebase omits them),
// and @credible/shared / @credible/types are workspace packages whose
// "main" points at raw .ts source, which plain Node can't execute.
// Bundling inlines both workspace packages while leaving real npm
// dependencies external (native modules like argon2 must not be bundled).
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies).filter((name) => !name.startsWith('@credible/'));

const entryPoints = ['src/server.ts', 'src/workers/index.ts'];

await build({
  entryPoints,
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outExtension: { '.js': '.js' },
  sourcemap: true,
  external,
});

console.log(`Built: ${entryPoints.join(', ')}`);
