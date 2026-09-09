// Connector fallback: inline only the four explicitly public deployment settings.
// Never extend this allowlist with credentials, service-role keys or SMTP secrets.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';

const source = parseEnv(readFileSync('.env.local', 'utf8'));
const names = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'APP_URL',
  'GOOGLE_AUTH_ENABLED',
];
const env = Object.fromEntries(names.map((name) => [name, source[name]]));
if (names.some((name) => typeof env[name] !== 'string' || !env[name]))
  throw new Error('Missing public deployment configuration');
if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_'))
  throw new Error('Only publishable Supabase keys are allowed');
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'APP_URL']) {
  const url = new URL(env[name]);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error(`Invalid public origin: ${name}`);
}
if (!['true', 'false'].includes(env.GOOGLE_AUTH_ENABLED))
  throw new Error('Invalid Google provider flag');
const rootFiles = new Set([
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'next-env.d.ts',
  'tsconfig.json',
]);
const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(
    (path) =>
      path && (path.startsWith('src/') || path.startsWith('public/') || rootFiles.has(path)),
  );
const files = paths.map((file) => {
  const binary = /\.(webp|png|jpe?g|woff2?|ico|pdf)$/i.test(file);
  return {
    file,
    data: readFileSync(file, binary ? 'base64' : 'utf8'),
    ...(binary ? { encoding: 'base64' } : {}),
  };
});
const config = files.find((file) => file.file === 'next.config.ts');
const marker = 'const config: NextConfig = {';
if (!config || config.data.split(marker).length !== 2 || /\benv\s*:/.test(config.data))
  throw new Error('Review next.config.ts before injecting public configuration');
config.data = config.data.replace(
  marker,
  `${marker}\n  // Public deployment settings only; never include secrets here.\n  env: ${JSON.stringify(env)},`,
);
mkdirSync('.vercel', { recursive: true });
writeFileSync('.vercel/configured-deploy.json', JSON.stringify(files));
console.log(
  `Prepared ${files.length} files in .vercel/configured-deploy.json; values are not logged.`,
);
