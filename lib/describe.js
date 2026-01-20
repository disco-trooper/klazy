// lib/describe.js
const { spawnSync } = require('child_process');
const { select } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');
const { getPods } = require('./exec');
const { colorizeStatus } = require('./colors');

function colorizeDescribe(output) {
  return output.split('\n').map(line => {
    // Match whole words only, or status at end of line
    return line.replace(/\b(Running|Pending|Waiting|Terminated|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff)\b|(?<=:\s+)(True|False)(?=\s*$)/g,
      (match) => colorizeStatus(match));
  }).join('\n');
}

async function describePod(searchTerm, allNamespaces = false) {
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
    const selected = await select({ question: 'Select pod to describe:', options: displayNames, autocomplete: true });
    if (!selected) return;
    const selectedIdx = displayNames.indexOf(selected);
    selectedPod = pods[selectedIdx];
  }

  const ns = selectedPod.namespace || getCurrentNamespace();
  const result = spawnSync('kubectl', ['describe', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(colorizeDescribe(result.stdout));
  } else {
    console.log(result.stderr || 'Failed to describe pod');
  }
}

module.exports = { describePod };
