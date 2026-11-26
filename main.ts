/**
 * Statistik Indonesia — entrypoint (Node 22, no dependencies).
 *
 * Builds the hand-in directory `out/` from the repository:
 *   1. copies app/ and screenshots/ into out/
 *   2. writes out/dossier.json with make.fun's dossier library
 *      (vendor/makefun-frontend.ts, copied from the kit unchanged),
 *      so the scorer can compare the site by its screenshots and an
 *      outline of its source.
 *
 * Run:  node main.ts        (from the repository root)
 * Then open out/app/index.html in a browser, or serve out/ with any
 * static server, e.g. `python3 -m http.server --directory out`.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const ROOT = dirname(fileURLToPath(import.meta.url));
/* The grader mounts the repo read-only and provides a writable output
   dir via MAKEFUN_OUTPUT_DIR; locally (no env set) fall back to out/. */
const OUT = (process.env.MAKEFUN_OUTPUT_DIR ?? '').trim() || join(ROOT, 'out');

/* The caps the kit's dossier library documents in its header comment.
   Only text_max_bytes shapes the dossier bytes; the other caps only
   refuse input that is past them. */
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216
};

function fail(message: string): never {
  console.error('main.ts: ' + message);
  process.exit(1);
}

function main(): void {
  const appDir = join(ROOT, 'app');
  const shotsDir = join(ROOT, 'screenshots');
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
    fail('app/ is missing — the site lives in app/index.html.');
  }
  if (!existsSync(join(appDir, 'index.html'))) {
    fail('app/index.html is missing.');
  }
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
    fail('screenshots/ is missing — add 3 or 4 real renders of the site.');
  }

  /* Clear OUT's contents without removing OUT itself: when the grader
     provides MAKEFUN_OUTPUT_DIR it is a mount point, and removing a
     mount point fails with EBUSY. Locally this is equivalent. */
  mkdirSync(OUT, { recursive: true });
  for (const entry of readdirSync(OUT)) {
    rmSync(join(OUT, entry), { recursive: true, force: true });
  }
  cpSync(appDir, join(OUT, 'app'), { recursive: true });
  cpSync(shotsDir, join(OUT, 'screenshots'), { recursive: true });

  const dossier = buildDossier(OUT, DOSSIER_CAPS);
  writeFileSync(join(OUT, 'dossier.json'), dossier);

  const appFiles = countFiles(join(OUT, 'app'));
  const shots = countFiles(join(OUT, 'screenshots'));
  console.log('Statistik Indonesia — build complete.');
  console.log(`  ${OUT}/app/: ${appFiles} files`);
  console.log(`  ${OUT}/screenshots/: ${shots} files`);
  console.log(`  ${OUT}/dossier.json: ${dossier.length} bytes`);
  console.log(`Open ${OUT}/app/index.html in a browser to view the site.`);
}

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(join(dir, entry.name));
    else if (entry.isFile()) n += 1;
  }
  return n;
}

main();
