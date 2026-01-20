// src/restart.ts
import { spawnSync } from 'node:child_process';
import { select } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import type { Pod } from './types';

export async function restartPod(searchTerm?: string, allNamespaces: boolean = false): Promise<void> {
  const pods = getPods(allNamespaces);

  if (pods.length === 0) {
    console.log('No pods found');
    return;
  }

  let selectedPod: Pod | undefined;

  if (searchTerm) {
    const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const filtered = fuzzyFilter(podNames, searchTerm);
    if (filtered.length === 0) {
      console.log(`No pods matching "${searchTerm}"`);
      return;
    }
    if (filtered.length === 1) {
      selectedPod = pods[filtered[0].originalIndex];
    } else {
      const displayNames = filtered.map(f => podNames[f.originalIndex]);
      const selected = await select({question: 'Select pod to restart:', options: displayNames, autocomplete: true});
      if (!selected) return;
      const idx = displayNames.indexOf(selected);
      selectedPod = pods[filtered[idx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({question: 'Select pod to restart:', options: displayNames, autocomplete: true});
    if (!selected) return;
    const idx = displayNames.indexOf(selected);
    selectedPod = pods[idx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();

  console.log(`Restarting pod ${colorize(selectedPod.name, 'yellow')}...`);

  const result = spawnSync('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(colorize('Pod deleted. Kubernetes will recreate it.', 'green'));
  } else {
    console.log(colorize('Failed to restart pod', 'red'));
  }
}
