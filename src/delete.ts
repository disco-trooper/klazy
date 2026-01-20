// src/delete.ts
import { spawnSync } from 'node:child_process';
import { input } from './cli';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import { selectPod } from './misc';

export async function deletePod(searchTerm?: string, allNamespaces: boolean = false, force: boolean = false): Promise<void> {
  const pods = getPods(allNamespaces);

  const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to delete:');
  if (!selectedPod) return;

  const ns = selectedPod.namespace || getCurrentNamespace();

  if (!force) {
    console.log(`\nAbout to delete pod ${colorize(selectedPod.name, 'red')} in namespace ${colorize(ns, 'magenta')}`);
    const confirm = await input({question: 'Type pod name to confirm'});
    if (confirm !== selectedPod.name) {
      console.log('Deletion cancelled');
      return;
    }
  }

  console.log(`Deleting pod ${selectedPod.name}...`);
  spawnSync('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { stdio: 'inherit' });
}
