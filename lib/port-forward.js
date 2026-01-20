// lib/port-forward.js
const { spawn } = require('child_process');
const { select, input } = require('./cli');
const { configuration, lastCommandKey } = require('./config');
const { getCurrentNamespace } = require('./namespace');
const { colorize } = require('./colors');
const { fuzzyFilter } = require('./fuzzy');
const { getPods } = require('./exec');

function getServices() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('kubectl get services -o jsonpath=\'{range .items[*]}{.metadata.name}{"\\n"}{end}\'', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function portForward(resourceType) {
  const namespace = getCurrentNamespace();
  let resourceName, localPort, remotePort;

  if (resourceType === 'service') {
    const services = getServices();
    if (services.length === 0) {
      console.log('No services found');
      return;
    }
    const selected = await select({question: 'Select service:', options: services, autocomplete: true});
    if (selected === -1) return;
    resourceName = selected;
  } else {
    const pods = getPods();
    if (pods.length === 0) {
      console.log('No pods found');
      return;
    }
    const podNames = pods.map(p => p.name);
    const selected = await select({question: 'Select pod:', options: podNames, autocomplete: true});
    if (selected === -1) return;
    resourceName = selected;
  }

  localPort = await input({question: 'Local port', validationCallback: (v) => /^\d+$/.test(v)});
  remotePort = await input({question: 'Remote port', defaultValue: localPort, validationCallback: (v) => /^\d+$/.test(v)});

  const resource = resourceType === 'service' ? 'svc' : 'pod';
  const cmd = `kubectl port-forward ${resource}/${resourceName} ${localPort}:${remotePort} -n ${namespace}`;
  configuration.put({[lastCommandKey]: cmd});

  console.log(`Port forwarding ${colorize(resourceName, 'cyan')} ${colorize(localPort, 'green')}:${colorize(remotePort, 'green')}`);

  const proc = spawn('kubectl', ['port-forward', `${resource}/${resourceName}`, `${localPort}:${remotePort}`, '-n', namespace], {
    stdio: 'inherit'
  });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(colorize(`Port forward ended (code ${code})`, 'yellow'));
    }
  });
}

module.exports = { portForward };
