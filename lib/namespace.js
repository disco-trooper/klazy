// lib/namespace.js
const { spawnSync } = require('child_process');
const { select } = require('./cli');
const { getConfig, writeConfig } = require('./config');
const { colorize } = require('./colors');

function getNamespaces() {
  const result = spawnSync('kubectl', ['get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}'], { encoding: 'utf8' });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout.trim().split(' ').filter(Boolean);
}

function getCurrentNamespace() {
  try {
    const result = spawnSync('kubectl', ['config', 'view', '--minify', '-o', 'jsonpath={..namespace}'], { encoding: 'utf8' });
    if (result.status !== 0) {
      return 'default';
    }
    return result.stdout.trim() || 'default';
  } catch {
    return 'default';
  }
}

function setNamespace(ns) {
  spawnSync('kubectl', ['config', 'set-context', '--current', `--namespace=${ns}`], { encoding: 'utf8' });
}

async function useNamespace(targetNs) {
  const config = getConfig();
  const currentNs = getCurrentNamespace();

  let newNs;

  if (targetNs === '-') {
    if (!config.previousNamespace) {
      console.log('No previous namespace to switch to');
      return;
    }
    newNs = config.previousNamespace;
  } else if (targetNs) {
    newNs = targetNs;
  } else {
    const namespaces = getNamespaces();
    const selected = await select({question: 'Select namespace:', options: namespaces, autocomplete: true});
    if (!selected) return;
    newNs = selected;
  }

  config.previousNamespace = currentNs;
  writeConfig(config);

  setNamespace(newNs);
  console.log(`Switched to namespace: ${colorize(newNs, 'magenta')}`);
}

module.exports = { useNamespace, getCurrentNamespace, getNamespaces };
