// lib/exec.ts
import { spawnSync, spawn } from 'node:child_process';
import { select } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import type { Pod } from './types';

/**
 * Get all pods, optionally across all namespaces
 */
export function getPods(allNamespaces: boolean = false): Pod[] {
  const args = ['get', 'pods', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  const result = spawnSync('kubectl', args, { encoding: 'utf8' });
  if (result.status !== 0) return [];

  return result.stdout.trim().split('\n').filter(Boolean).map(line => {
    const [name, namespace] = line.split('\t');
    return { name, namespace };
  });
}

/**
 * Interactive exec into a pod
 */
export async function execIntoPod(searchTerm?: string, allNamespaces: boolean = false): Promise<void> {
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
      const selected = await select({ question: 'Select pod:', options: displayNames, autocomplete: true });
      if (!selected) return;
      const selectedIdx = displayNames.indexOf(selected);
      selectedPod = pods[filtered[selectedIdx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({ question: 'Select pod to exec into:', options: displayNames, autocomplete: true });
    if (!selected) return;
    const selectedIdx = displayNames.indexOf(selected);
    selectedPod = pods[selectedIdx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();
  console.log(`Executing into ${selectedPod.name}...`);

  const child = spawn('kubectl', ['exec', '-it', '-n', ns, selectedPod.name, '--', '/bin/sh'], {
    stdio: 'inherit'
  });

  child.on('error', (err: Error) => {
    console.error('Failed to exec:', err.message);
  });
}
