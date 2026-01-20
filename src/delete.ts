// src/delete.ts
import { spawnSync } from 'node:child_process';
import { select, input } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import type { Pod } from './types';

export async function deletePod(searchTerm?: string, allNamespaces: boolean = false, force: boolean = false): Promise<void> {
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
      const selected = await select({question: 'Select pod to delete:', options: displayNames, autocomplete: true});
      if (!selected) return;
      const idx = displayNames.indexOf(selected);
      selectedPod = pods[filtered[idx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({question: 'Select pod to delete:', options: displayNames, autocomplete: true});
    if (!selected) return;
    const idx = displayNames.indexOf(selected);
    selectedPod = pods[idx];
  }

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
