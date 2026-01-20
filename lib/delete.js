// lib/delete.js
const { execSync } = require('child_process');
const { select, input } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');
const { colorize } = require('./colors');
const { getPods } = require('./exec');

async function deletePod(searchTerm, allNamespaces = false, force = false) {
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
      const selected = await select({question: 'Select pod to delete:', options: displayNames, autocomplete: true});
      if (selected === -1) return;
      const idx = displayNames.indexOf(selected);
      selectedPod = pods[filtered[idx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({question: 'Select pod to delete:', options: displayNames, autocomplete: true});
    if (selected === -1) return;
    const idx = displayNames.indexOf(selected);
    selectedPod = pods[idx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();

  if (!force) {
    console.log(`\nAbout to delete pod ${colorize(selectedPod.name, 'red')} in namespace ${colorize(ns, 'magenta')}`);
    const confirm = await input({question: 'Type pod name to confirm'});
    if (confirm !== selectedPod.name) {
      console.log('Deletion cancelled');
      return;
    }
  }

  console.log(`Deleting pod ${selectedPod.name}...`);
  execSync(`kubectl delete pod ${selectedPod.name} -n ${ns}`, { stdio: 'inherit' });
}

module.exports = { deletePod };
