// src/port-forward.ts
import { spawnSync, spawn, ChildProcess } from 'node:child_process';
import { input } from './cli';
import { configuration, lastCommandKey } from './config';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import { selectPort, validatePort, selectService, selectPod, selectContext, selectNamespace, selectResource } from './misc';
import type { Service, ResourceType } from './types';

export function getServices(allNamespaces: boolean = false): Service[] {
  const args = ['get', 'services', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  const result = spawnSync('kubectl', args, { encoding: 'utf8' });
  if (result.status !== 0) return [];

  return result.stdout.trim().split('\n').filter(Boolean).map(line => {
    const [name, namespace] = line.split('\t');
    return { name, namespace };
  });
}

export async function portForward(resourceType: ResourceType, allNamespaces: boolean = false, pick: boolean = false): Promise<void> {
  let resourceName: string;
  let localPort: string;
  let remotePort: string;
  let namespace: string;
  let context: string | undefined;

  if (pick) {
    // laku-style flow: context -> namespace -> resource
    context = await selectContext();
    if (!context) return;

    namespace = await selectNamespace(context);
    if (!namespace) return;

    const resource = resourceType === 'service' ? 'service' : 'pod';
    resourceName = await selectResource(resource, context, namespace);
    if (!resourceName) return;
  } else if (resourceType === 'service') {
    const services = getServices(allNamespaces);
    const selectedService = await selectService(services, undefined, allNamespaces);
    if (!selectedService) return;
    resourceName = selectedService.name;
    namespace = selectedService.namespace || getCurrentNamespace();
  } else {
    const pods = getPods(allNamespaces);
    const selectedPod = await selectPod(pods, undefined, allNamespaces, 'Select pod:');
    if (!selectedPod) return;
    resourceName = selectedPod.name;
    namespace = selectedPod.namespace || getCurrentNamespace();
  }

  localPort = await input({question: 'Local port', validationCallback: validatePort});
  remotePort = await input({question: 'Remote port', defaultValue: localPort, validationCallback: validatePort});

  const resource = resourceType === 'service' ? 'svc' : 'pod';
  const contextFlag = context ? ['--context', context] : [];
  const cmd = `kubectl port-forward ${resource}/${resourceName} ${localPort}:${remotePort} -n ${namespace}${context ? ` --context ${context}` : ''}`;
  configuration.put({[lastCommandKey]: cmd});

  console.log(`Port forwarding ${colorize(resourceName, 'cyan')} ${colorize(localPort, 'green')}:${colorize(remotePort, 'green')}${context ? ` (${colorize(context, 'yellow')})` : ''}`);

  const proc: ChildProcess = spawn('kubectl', ['port-forward', `${resource}/${resourceName}`, `${localPort}:${remotePort}`, '-n', namespace, ...contextFlag], {
    stdio: 'inherit'
  });

  proc.on('close', (code: number | null) => {
    if (code !== 0 && code !== null) {
      console.log(colorize(`Port forward ended (code ${code})`, 'yellow'));
    }
  });
}
