// src/metrics.ts
import { spawnSync } from 'node:child_process';
import { colorize } from './colors';

export async function showMetrics(resourceType: string = 'pods', allNamespaces: boolean = false): Promise<void> {
  const type = resourceType === 'nodes' ? 'nodes' : 'pods';
  const args = ['top', type];
  if (allNamespaces) args.push('--all-namespaces');

  const result = spawnSync('kubectl', args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.log(colorize('Failed to get metrics. Is metrics-server running?', 'yellow'));
    console.log('Install: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml');
  }
}
