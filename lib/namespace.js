// lib/namespace.js
const { execSync } = require('child_process');
const { select } = require('./cli');
const { getConfig, writeConfig } = require('./config');

function getNamespaces() {
  const output = execSync('kubectl get namespaces -o jsonpath="{.items[*].metadata.name}"', { encoding: 'utf8' });
  return output.trim().split(' ').filter(Boolean);
}

function getCurrentNamespace() {
  try {
    const output = execSync('kubectl config view --minify -o jsonpath="{..namespace}"', { encoding: 'utf8' });
    return output.trim() || 'default';
  } catch {
    return 'default';
  }
}

function setNamespace(ns) {
  execSync(`kubectl config set-context --current --namespace=${ns}`, { encoding: 'utf8' });
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
    const selectedIndex = await select({question: 'Select namespace:', options: namespaces, autocomplete: true});
    if (selectedIndex === -1) return;
    newNs = selectedIndex;
  }

  config.previousNamespace = currentNs;
  writeConfig(config);

  setNamespace(newNs);
  console.log(`Switched to namespace: ${newNs}`);
}

module.exports = { useNamespace, getCurrentNamespace, getNamespaces };
