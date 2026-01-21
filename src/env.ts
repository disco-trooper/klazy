// src/env.ts
import { spawnSync } from 'node:child_process';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import { selectPod, selectContext, selectNamespace, selectResource } from './misc';

function formatEnvOutput(envString: string): string {
  return envString.split('\n').filter(Boolean).map(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    return `${colorize(key, 'cyan')}=${value}`;
  }).join('\n');
}

export async function showEnv(searchTerm?: string, allNamespaces: boolean = false, pick: boolean = false): Promise<void> {
  let podName: string;
  let ns: string;
  let context: string | undefined;

  if (pick) {
    context = await selectContext();
    if (!context) return;

    ns = await selectNamespace(context);
    if (!ns) return;

    podName = await selectResource('pod', context, ns);
    if (!podName) return;
  } else {
    const pods = getPods(allNamespaces);
    const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to show env from:');
    if (!selectedPod) return;

    podName = selectedPod.name;
    ns = selectedPod.namespace || getCurrentNamespace();
  }

  const contextFlag = context ? ['--context', context] : [];
  const result = spawnSync('kubectl', ['exec', '-n', ns, ...contextFlag, podName, '--', 'env'], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(formatEnvOutput(result.stdout));
  } else {
    console.log(colorize('Failed to get env. Pod might not be running.', 'red'));
  }
}
