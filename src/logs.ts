// src/logs.ts
import { spawnSync, spawn, ChildProcess } from 'node:child_process';
import { select } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import { getPods } from './exec';
import { getServices } from './port-forward';
import type { Pod, Service, FuzzyResult, ResourceType } from './types';

function getServicePods(serviceName: string, namespace: string): string[] {
  const selectorResult = spawnSync('kubectl', [
    'get', 'service', serviceName, '-n', namespace,
    '-o', 'jsonpath={.spec.selector}'
  ], { encoding: 'utf8' });

  if (selectorResult.status !== 0) return [];

  try {
    const selector = JSON.parse(selectorResult.stdout.replace(/'/g, '"')) as Record<string, string>;
    const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');

    const podsResult = spawnSync('kubectl', [
      'get', 'pods', '-n', namespace, '-l', labelSelector,
      '-o', 'jsonpath={.items[*].metadata.name}'
    ], { encoding: 'utf8' });

    if (podsResult.status !== 0) return [];
    return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
  } catch (err) {
    console.error('Failed to parse service selector:', err instanceof Error ? err.message : 'unknown error');
    return [];
  }
}

export async function streamLogs(resourceType: ResourceType, searchTerm: string | undefined, allNamespaces: boolean = false, follow: boolean = true): Promise<void> {
  let podName: string;
  let namespace: string;

  if (resourceType === 'service') {
    // Service logs - select service, then its pod
    const services = getServices(allNamespaces);
    if (services.length === 0) {
      console.log('No services found');
      return;
    }

    let selectedService: Service;
    if (searchTerm) {
      const names = services.map(s => allNamespaces ? `${s.namespace}/${s.name}` : s.name);
      const filtered = fuzzyFilter(names, searchTerm);
      if (filtered.length === 0) {
        console.log(`No services matching "${searchTerm}"`);
        return;
      }
      if (filtered.length === 1) {
        selectedService = services[filtered[0].originalIndex];
      } else {
        const displayNames = filtered.map(f => names[f.originalIndex]);
        const selected = await select({question: 'Select service:', options: displayNames, autocomplete: true});
        if (!selected) return;
        const idx = displayNames.indexOf(selected);
        if (idx === -1) return;
        selectedService = services[filtered[idx].originalIndex];
      }
    } else {
      const displayNames = services.map(s => allNamespaces ? `${s.namespace}/${s.name}` : s.name);
      const selected = await select({question: 'Select service:', options: displayNames, autocomplete: true});
      if (!selected) return;
      const idx = displayNames.indexOf(selected);
      if (idx === -1) return;
      selectedService = services[idx];
    }

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
    if (pods.length === 0) {
      console.log('No pods found');
      return;
    }

    let selectedPod: Pod;
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
        const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
        if (!selected) return;
        const idx = displayNames.indexOf(selected);
        if (idx === -1) return;
        selectedPod = pods[filtered[idx].originalIndex];
      }
    } else {
      const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
      const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
      if (!selected) return;
      const idx = displayNames.indexOf(selected);
      if (idx === -1) return;
      selectedPod = pods[idx];
    }

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
