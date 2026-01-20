// lib/get-resources.js
const { spawnSync } = require('child_process');
const { select } = require('./cli');
const { configuration, lastCommandKey } = require('./config');
const { getCurrentNamespace } = require('./namespace');
const { colorizeStatus } = require('./colors');

const RESOURCE_ALIASES = {
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

const RESOURCE_OPTIONS = ['pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'configmaps', 'secrets', 'ingresses'];

function resolveResourceType(input) {
  if (!input) return null;
  return RESOURCE_ALIASES[input.toLowerCase()] || null;
}

function colorizeOutput(output) {
  return output.split('\n').map(line => {
    // Colorize status keywords
    return line.replace(/(Running|Pending|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff|Terminated|Ready|NotReady|True|False)/g,
      (match) => colorizeStatus(match));
  }).join('\n');
}

const getResources = async (resourceType, allNamespaces = false) => {
  let resource;
  if (resourceType) {
    resource = resolveResourceType(resourceType);
    if (!resource) {
      console.log(`Unknown resource type: ${resourceType}`);
      return;
    }
  } else {
    const selected = await select({question: 'Select resource:', options: RESOURCE_OPTIONS, autocomplete: true});
    if (!selected) return;
    resource = selected;
  }

  const ns = getCurrentNamespace();
  const args = ['get', resource];
  if (allNamespaces) {
    args.push('--all-namespaces');
  } else {
    args.push('-n', ns);
  }

  const cmd = `kubectl get ${resource} ${allNamespaces ? '--all-namespaces' : `-n ${ns}`}`;
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

module.exports = { getResources };
