// lib/exec.js
const { spawnSync, spawn } = require('child_process');
const { select } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');

function getPods(allNamespaces = false) {
  const args = ['get', 'pods', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  const result = spawnSync('kubectl', args, { encoding: 'utf8' });
  if (result.status !== 0) return [];

  return result.stdout.trim().split('\n').filter(Boolean).map(line => {
    const [name, namespace] = line.split('\t');
    return { name, namespace };
  });
}

async function execIntoPod(searchTerm, allNamespaces = false) {
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
      const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
      if (!selected) return;
      const selectedIdx = displayNames.indexOf(selected);
      selectedPod = pods[filtered[selectedIdx].originalIndex];
    }
  } else {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({question: 'Select pod to exec into:', options: displayNames, autocomplete: true});
    if (!selected) return;
    const selectedIdx = displayNames.indexOf(selected);
    selectedPod = pods[selectedIdx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();
  console.log(`Executing into ${selectedPod.name}...`);

  const child = spawn('kubectl', ['exec', '-it', '-n', ns, selectedPod.name, '--', '/bin/sh'], {
    stdio: 'inherit'
  });

  child.on('error', (err) => {
    console.error('Failed to exec:', err.message);
  });
}

module.exports = { execIntoPod, getPods };
