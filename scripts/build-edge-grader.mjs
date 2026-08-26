import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(root, 'src/edge/graderEntry.ts')],
  outfile: path.join(root, 'supabase/functions/_shared/grader.generated.js'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  minify: true,
  sourcemap: false,
  alias: { '@': path.join(root, 'src') },
  legalComments: 'none',
});
