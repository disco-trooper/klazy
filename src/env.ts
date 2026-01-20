// src/env.ts
import { spawnSync } from 'node:child_process';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import { selectPod } from './misc';

function formatEnvOutput(envString: string): string {
  return envString.split('\n').filter(Boolean).map(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    return `${colorize(key, 'cyan')}=${value}`;
  }).join('\n');
}

export async function showEnv(searchTerm?: string, allNamespaces: boolean = false): Promise<void> {
  const pods = getPods(allNamespaces);

  const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to show env from:');
  if (!selectedPod) return;

  const ns = selectedPod.namespace || getCurrentNamespace();

  const result = spawnSync('kubectl', ['exec', '-n', ns, selectedPod.name, '--', 'env'], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(formatEnvOutput(result.stdout));
  } else {
    console.log(colorize('Failed to get env. Pod might not be running.', 'red'));
  }
}
