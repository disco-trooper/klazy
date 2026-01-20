// lib/metrics.ts
import { execSync } from 'node:child_process';
import { colorize } from './colors';

async function showMetrics(resourceType: string = 'pods', allNamespaces: boolean = false): Promise<void> {
  const nsFlag = allNamespaces ? '--all-namespaces' : '';
  const type = resourceType === 'nodes' ? 'nodes' : 'pods';

  try {
    execSync(`kubectl top ${type} ${nsFlag}`, { stdio: 'inherit' });
  } catch (err) {
    console.log(colorize('Failed to get metrics. Is metrics-server running?', 'yellow'));
    console.log('Install: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml');
  }
}

export { showMetrics };
