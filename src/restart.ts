// src/restart.ts
import { spawnSync } from 'node:child_process';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import { selectPod } from './misc';

export async function restartPod(searchTerm?: string, allNamespaces: boolean = false): Promise<void> {
  const pods = getPods(allNamespaces);

  const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to restart:');
  if (!selectedPod) return;

  const ns = selectedPod.namespace || getCurrentNamespace();

  console.log(`Restarting pod ${colorize(selectedPod.name, 'yellow')}...`);

  const result = spawnSync('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(colorize('Pod deleted. Kubernetes will recreate it.', 'green'));
  } else {
    console.log(colorize('Failed to restart pod', 'red'));
  }
}
