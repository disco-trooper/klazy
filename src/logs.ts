// src/logs.ts
import { spawnSync, spawn, ChildProcess } from 'node:child_process';
import { select } from './cli';
import { getCurrentNamespace } from './namespace';
import { getPods } from './exec';
import { getServices } from './port-forward';
import { selectService, selectPod, selectContext, selectNamespace, selectResource } from './misc';
import type { ResourceType, StreamLogsOptions } from './types';

function getServicePodsWithContext(serviceName: string, namespace: string, context?: string): string[] {
  // Get service as full JSON to avoid quote issues with jsonpath
  const contextFlag = context ? ['--context', context] : [];
  const selectorResult = spawnSync('kubectl', [
    'get', 'service', serviceName, '-n', namespace,
    ...contextFlag,
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
      ...contextFlag,
      '-o', 'jsonpath={.items[*].metadata.name}'
    ], { encoding: 'utf8' });

    if (podsResult.status !== 0) return [];
    return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
  } catch (err) {
    console.error('Failed to parse service:', err instanceof Error ? err.message : 'unknown error');
    return [];
  }
}

export async function streamLogs(
  resourceType: ResourceType,
  searchTerm: string | undefined,
  options: StreamLogsOptions = {}
): Promise<void> {
  const { allNamespaces = false, follow = true, pick = false, pipeCmd } = options;
  let podName: string;
  let namespace: string;
  let context: string | undefined;

  if (pick) {
    // laku-style flow: context -> namespace -> resource
    context = await selectContext();
    if (!context) return;

    namespace = await selectNamespace(context);
    if (!namespace) return;

    if (resourceType === 'service') {
      // Pick service, then its pod
      const serviceName = await selectResource('service', context, namespace);
      if (!serviceName) return;

      const servicePods = getServicePodsWithContext(serviceName, namespace, context);
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
      podName = await selectResource('pod', context, namespace);
      if (!podName) return;
    }
  } else if (resourceType === 'service') {
    // Service logs - select service, then its pod
    const services = getServices(allNamespaces);
    const selectedService = await selectService(services, searchTerm, allNamespaces);
    if (!selectedService) return;

    namespace = selectedService.namespace || getCurrentNamespace();
    const servicePods = getServicePodsWithContext(selectedService.name, namespace);

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

  const contextFlag = context ? ['--context', context] : [];
  const args = ['logs', podName, '-n', namespace, ...contextFlag];
  if (follow) args.push('-f');

  console.log(`Streaming logs from ${podName}...`);

  if (pipeCmd) {
    const kubectlProc = spawn('kubectl', args, { stdio: ['inherit', 'pipe', 'inherit'] });
    kubectlProc.on('error', (err) => {
      console.error(`kubectl error: ${err.message}`);
    });
    const pipeProc = spawn(pipeCmd, [], { stdio: ['pipe', 'inherit', 'inherit'], shell: true });
    pipeProc.on('error', (err) => {
      console.error(`Pipe command '${pipeCmd}' failed: ${err.message}`);
    });

    kubectlProc.stdout?.pipe(pipeProc.stdin!);

    pipeProc.on('close', (code: number | null) => {
      if (code !== 0 && code !== null) {
        console.log(`\nPipe ended (code ${code})`);
      }
    });
  } else {
    const proc: ChildProcess = spawn('kubectl', args, { stdio: 'inherit' });

    proc.on('close', (code: number | null) => {
      if (code !== 0 && code !== null) {
        console.log(`\nLogs ended (code ${code})`);
      }
    });
  }
}
