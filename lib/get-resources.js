const cp = require('child_process');
const {selectContext, selectNamespace} = require('./misc');
const {input, select} = require("./cli");
const {configuration, lastCommandKey} = require("./config");

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

function resolveResourceType(input) {
  if (!input) return null;
  return RESOURCE_ALIASES[input.toLowerCase()] || input;
}

const getResources = async (resourceType, allNamespaces = false) => {
    let resource;
    if (resourceType) {
        resource = resolveResourceType(resourceType);
    } else {
        resource = await select({question: 'select resource', options: ['pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'configmaps', 'secrets', 'ingresses']});
    }
    const context = await selectContext();
    const nsFlag = allNamespaces ? '--all-namespaces' : `--namespace ${await selectNamespace(context)}`;
    const cmd = `kubectl get ${resource} ${nsFlag} --context ${context}`;
    configuration.put({[lastCommandKey]: cmd});
    console.log(cmd);
    cp.execSync(cmd, {stdio: 'inherit'});
};

module.exports = {getResources};