// lib/get-resources.ts
import { spawnSync } from 'node:child_process';
import { select } from './cli';
import { configuration, lastCommandKey } from './config';
import { getCurrentNamespace } from './namespace';
import { colorizeStatus } from './colors';
import { selectContext, selectNamespace } from './misc';

const RESOURCE_ALIASES: Record<string, string> = {
  'po': 'pods', 'pod': 'pods', 'pods': 'pods',
  'svc': 'services', 'service': 'services', 'services': 'services',
  'deploy': 'deployments', 'deployment': 'deployments', 'deployments': 'deployments',
  'sts': 'statefulsets', 'statefulset': 'statefulsets', 'statefulsets': 'statefulsets',
  'ds': 'daemonsets', 'daemonset': 'daemonsets', 'daemonsets': 'daemonsets',
  'cm': 'configmaps', 'configmap': 'configmaps', 'configmaps': 'configmaps',
  'secret': 'secrets', 'secrets': 'secrets',
  'ing': 'ingresses', 'ingress': 'ingresses', 'ingresses': 'ingresses',
  'pvc': 'persistentvolumeclaims', 'persistentvolumeclaims': 'persistentvolumeclaims',
  'ns': 'namespaces', 'namespaces': 'namespaces',
  'node': 'nodes', 'nodes': 'nodes',
};

const RESOURCE_OPTIONS: string[] = ['pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'configmaps', 'secrets', 'ingresses', 'persistentvolumeclaims', 'namespaces', 'nodes'];

function resolveResourceType(input: string): string | null {
  if (!input) return null;
  return RESOURCE_ALIASES[input.toLowerCase()] || null;
}

function colorizeOutput(output: string): string {
  return output.split('\n').map(line => {
    // Colorize status keywords
    return line.replace(/(Running|Pending|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff|Terminated|Ready|NotReady|True|False)/g,
      (match) => colorizeStatus(match));
  }).join('\n');
}

export const getResources = async (resourceType: string, allNamespaces: boolean = false, pick: boolean = false): Promise<void> => {
  let resource: string;
  let ns: string = '';
  let context: string | undefined;

  if (pick) {
    context = await selectContext();
    if (!context) return;

    ns = await selectNamespace(context);
    if (!ns) return;
  } else {
    ns = getCurrentNamespace();
  }

  if (resourceType) {
    const resolved = resolveResourceType(resourceType);
    if (!resolved) {
      console.log(`Unknown resource type: ${resourceType}`);
      return;
    }
    resource = resolved;
  } else {
    const selected = await select({question: 'Select resource:', options: RESOURCE_OPTIONS, autocomplete: true});
    if (!selected) return;
    resource = selected;
  }

  const contextFlag = context ? ['--context', context] : [];
  const args: string[] = ['get', resource, ...contextFlag];
  if (allNamespaces && !pick) {
    args.push('--all-namespaces');
  } else {
    args.push('-n', ns);
  }

  const cmd = `kubectl get ${resource} ${allNamespaces && !pick ? '--all-namespaces' : `-n ${ns}`}${context ? ` --context ${context}` : ''}`;
  configuration.put({[lastCommandKey]: cmd});

  try {
    const result = spawnSync('kubectl', args, { encoding: 'utf8' });
    if (result.stdout) {
      console.log(colorizeOutput(result.stdout));
    }
    if (result.stderr) {
      console.error(result.stderr);
    }
  } catch (err) {
    console.error('Failed to get resources');
  }
};
