// src/logs.ts
import { spawnSync, spawn, ChildProcess } from 'node:child_process';
import { select } from './cli';
import { getCurrentNamespace } from './namespace';
import { getPods } from './exec';
import { getServices } from './port-forward';
import { selectService, selectPod } from './misc';
import type { ResourceType } from './types';

function getServicePods(serviceName: string, namespace: string): string[] {
  // Get service as full JSON to avoid quote issues with jsonpath
  const selectorResult = spawnSync('kubectl', [
    'get', 'service', serviceName, '-n', namespace,
    '-o', 'json'
  ], { encoding: 'utf8' });

  if (selectorResult.status !== 0) return [];

  try {
    const service = JSON.parse(selectorResult.stdout) as { spec?: { selector?: Record<string, string> } };
    const selector = service.spec?.selector;
    if (!selector || Object.keys(selector).length === 0) return [];

    const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');

    const podsResult = spawnSync('kubectl', [
      'get', 'pods', '-n', namespace, '-l', labelSelector,
      '-o', 'jsonpath={.items[*].metadata.name}'
    ], { encoding: 'utf8' });

    if (podsResult.status !== 0) return [];
    return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
  } catch (err) {
    console.error('Failed to parse service:', err instanceof Error ? err.message : 'unknown error');
    return [];
  }
}

export async function streamLogs(resourceType: ResourceType, searchTerm: string | undefined, allNamespaces: boolean = false, follow: boolean = true): Promise<void> {
  let podName: string;
  let namespace: string;

  if (resourceType === 'service') {
    // Service logs - select service, then its pod
    const services = getServices(allNamespaces);
    const selectedService = await selectService(services, searchTerm, allNamespaces);
    if (!selectedService) return;

    namespace = selectedService.namespace || getCurrentNamespace();
    const servicePods = getServicePods(selectedService.name, namespace);

    if (servicePods.length === 0) {
      console.log('No pods found for this service');
      return;
    }
    if (servicePods.length === 1) {
      podName = servicePods[0];
    } else {
      const selected = await select({question: 'Select pod:', options: servicePods, autocomplete: true});
      if (!selected) return;
      podName = selected;
    }
  } else {
    // Pod logs
    const pods = getPods(allNamespaces);
    const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod:');
    if (!selectedPod) return;

    podName = selectedPod.name;
    namespace = selectedPod.namespace || getCurrentNamespace();
  }

  const args = ['logs', podName, '-n', namespace];
  if (follow) args.push('-f');

  console.log(`Streaming logs from ${podName}...`);
  const proc: ChildProcess = spawn('kubectl', args, { stdio: 'inherit' });

  proc.on('close', (code: number | null) => {
    if (code !== 0 && code !== null) {
      console.log(`\nLogs ended (code ${code})`);
    }
  });
}
