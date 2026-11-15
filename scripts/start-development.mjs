import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { validateDevelopmentEnvironment } from './check-development-environment.mjs';

// Run from the project root. Never start an API server before checking its target.
try {
  process.loadEnvFile('.env.local');
  const errors = validateDevelopmentEnvironment(process.env);
  const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
  if (project.projectId !== 'prj_lxfy0zZNVbB6mT6FSV8xG2qkKcgE' ||
      project.orgId !== 'team_IeUCXxDoAFPT7NhMb2OmP3qE') {
    errors.push('Vercel link does not match the Metro Eats project and team.');
  }
  if (errors.length) throw new Error(errors.join('\n'));
} catch (error) {
  // Filesystem errors can include paths; report no credential values.
  console.error(error.code ? 'Local setup is incomplete. Follow DEV-ENVIRONMENT.md before starting.' : error.message);
  process.exit(1);
}

// Use an installed official CLI, or an explicit local CLI file for this machine.
// No arbitrary CLI arguments are forwarded: this command can only start localhost.
const cli = process.env.METRO_VERCEL_CLI;
if (!cli || !fs.existsSync(cli)) {
  console.error('Set METRO_VERCEL_CLI to the installed official Vercel CLI JavaScript entry point.');
  process.exit(1);
}
const config = process.env.METRO_VERCEL_GLOBAL_CONFIG;
const args = [cli, ...(config ? ['--global-config', config] : []), 'dev', '--listen', '127.0.0.1:3000'];
const child = spawn(process.execPath, args, {
  stdio: 'inherit', env: process.env,
});
child.on('error', () => { console.error('Could not start Vercel development server.'); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
