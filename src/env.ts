// lib/env.js
const { spawnSync } = require('node:child_process');
const { select } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');
const { colorize } = require('./colors');
const { getPods } = require('./exec');

function formatEnvOutput(envString) {
  return envString.split('\n').filter(Boolean).map(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    return `${colorize(key, 'cyan')}=${value}`;
  }).join('\n');
}

async function showEnv(searchTerm, allNamespaces = false) {
  const pods = getPods(allNamespaces);

  if (pods.length === 0) {
    console.log('No pods found');
    return;
  }

  let selectedPod;

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
      const selected = await select({ question: 'Select pod:', options: displayNames, autocomplete: true });
      if (!selected) return;
      const selectedIdx = displayNames.indexOf(selected);
      selectedPod = pods[filtered[selectedIdx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({ question: 'Select pod:', options: displayNames, autocomplete: true });
    if (!selected) return;
    const selectedIdx = displayNames.indexOf(selected);
    selectedPod = pods[selectedIdx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();

  const result = spawnSync('kubectl', ['exec', '-n', ns, selectedPod.name, '--', 'env'], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(formatEnvOutput(result.stdout));
  } else {
    console.log(colorize('Failed to get env. Pod might not be running.', 'red'));
  }
}

module.exports = { showEnv };
