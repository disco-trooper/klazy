// lib/describe.ts
import { spawnSync } from 'node:child_process';
import { select } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import { getPods } from './exec';
import { colorizeStatus } from './colors';
import type { Pod } from './types';

/**
 * Colorize status values in kubectl describe output
 */
function colorizeDescribe(output: string): string {
  return output.split('\n').map(line => {
    // Match whole words only, or status at end of line
    return line.replace(/\b(Running|Pending|Waiting|Terminated|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff)\b|(?<=:\s+)(True|False)(?=\s*$)/g,
      (match) => colorizeStatus(match));
  }).join('\n');
}

/**
 * Describe a pod with colorized output
 */
export async function describePod(searchTerm?: string, allNamespaces: boolean = false): Promise<void> {
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
    const selected = await select({ question: 'Select pod to describe:', options: displayNames, autocomplete: true });
    if (!selected) return;
    const selectedIdx = displayNames.indexOf(selected);
    selectedPod = pods[selectedIdx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();
  const result = spawnSync('kubectl', ['describe', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(colorizeDescribe(result.stdout));
  } else {
    console.log(result.stderr || 'Failed to describe pod');
  }
}
