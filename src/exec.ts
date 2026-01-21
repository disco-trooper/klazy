// lib/exec.ts
import { spawnSync, spawn } from 'node:child_process';
import { getCurrentNamespace } from './namespace';
import { selectPod, selectContext, selectNamespace, selectResource } from './misc';
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
export async function execIntoPod(searchTerm?: string, allNamespaces: boolean = false, pick: boolean = false): Promise<void> {
  let podName: string;
  let ns: string;
  let context: string | undefined;

  if (pick) {
    // laku-style flow: context -> namespace -> pod
    context = await selectContext();
    if (!context) return;

    ns = await selectNamespace(context);
    if (!ns) return;

    podName = await selectResource('pod', context, ns);
    if (!podName) return;
  } else {
    const pods = getPods(allNamespaces);
    const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to exec into:');
    if (!selectedPod) return;

    podName = selectedPod.name;
    ns = selectedPod.namespace || getCurrentNamespace();
  }

  console.log(`Executing into ${podName}...`);

  const contextFlag = context ? ['--context', context] : [];
  const child = spawn('kubectl', ['exec', '-it', '-n', ns, ...contextFlag, podName, '--', '/bin/sh'], {
    stdio: 'inherit'
  });

  child.on('error', (err: Error) => {
    console.error('Failed to exec:', err.message);
  });
}
