// lib/describe.ts
import { spawnSync } from 'node:child_process';
import { getCurrentNamespace } from './namespace';
import { getPods } from './exec';
import { colorizeStatus } from './colors';
import { selectPod } from './misc';

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

  const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to describe:');
  if (!selectedPod) return;

  const ns = selectedPod.namespace || getCurrentNamespace();
  const result = spawnSync('kubectl', ['describe', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(colorizeDescribe(result.stdout));
  } else {
    console.log(result.stderr || 'Failed to describe pod');
  }
}
