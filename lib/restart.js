// lib/restart.js
const { execSync } = require('child_process');
const { select } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');
const { colorize } = require('./colors');
const { getPods } = require('./exec');

async function restartPod(searchTerm, allNamespaces = false) {
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
      const idx = await select(displayNames, 'Select pod to restart:');
      if (idx === -1) return;
      selectedPod = pods[filtered[idx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const idx = await select(displayNames, 'Select pod to restart:');
    if (idx === -1) return;
    selectedPod = pods[idx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();

  console.log(`Restarting pod ${colorize(selectedPod.name, 'yellow')}...`);

  try {
    execSync(`kubectl delete pod ${selectedPod.name} -n ${ns}`, { encoding: 'utf8' });
    console.log(colorize('Pod deleted. Kubernetes will recreate it.', 'green'));
  } catch (err) {
    console.log(colorize('Failed to restart pod', 'red'));
  }
}

module.exports = { restartPod };
