// lib/copy.js
const { spawnSync } = require('child_process');
const { select, input } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');
const { colorize } = require('./colors');
const { getPods } = require('./exec');

async function copyFiles(srcArg, destArg, allNamespaces = false) {
  const pods = getPods(allNamespaces);
  if (pods.length === 0) {
    console.log('No pods found');
    return;
  }

  // Interactive mode if no args
  if (!srcArg) {
    const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
    if (!selected) return;
    const idx = displayNames.indexOf(selected);
    const selectedPod = pods[idx];
    const ns = selectedPod.namespace || getCurrentNamespace();

    const directions = ['From pod to local', 'From local to pod'];
    const directionSel = await select({question: 'Copy direction:', options: directions});
    if (!directionSel) return;
    const direction = directions.indexOf(directionSel);

    const remotePath = await input({question: 'Remote path (in pod)'});
    const localPath = await input({question: 'Local path'});

    if (direction === 0) {
      spawnSync('kubectl', ['cp', `${ns}/${selectedPod.name}:${remotePath}`, localPath], { stdio: 'inherit' });
    } else {
      spawnSync('kubectl', ['cp', localPath, `${ns}/${selectedPod.name}:${remotePath}`], { stdio: 'inherit' });
    }
    console.log(colorize('Copy completed', 'green'));
    return;
  }

  const src = srcArg;
  const dest = destArg || '.';

  if (src.includes(':')) {
    const [podPart, pathPart] = src.split(':');
    const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const filtered = fuzzyFilter(podNames, podPart);

    if (filtered.length === 0) {
      console.log(`No pods matching "${podPart}"`);
      return;
    }

    const selectedPod = pods[filtered[0].originalIndex];
    const ns = selectedPod.namespace || getCurrentNamespace();

    spawnSync('kubectl', ['cp', `${ns}/${selectedPod.name}:${pathPart}`, dest], { stdio: 'inherit' });
    console.log(colorize('Copy completed', 'green'));
  } else if (dest.includes(':')) {
    const [podPart, pathPart] = dest.split(':');
    const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
    const filtered = fuzzyFilter(podNames, podPart);

    if (filtered.length === 0) {
      console.log(`No pods matching "${podPart}"`);
      return;
    }

    const selectedPod = pods[filtered[0].originalIndex];
    const ns = selectedPod.namespace || getCurrentNamespace();

    spawnSync('kubectl', ['cp', src, `${ns}/${selectedPod.name}:${pathPart}`], { stdio: 'inherit' });
    console.log(colorize('Copy completed', 'green'));
  } else {
    console.log('Usage: klazy copy <pod>:/path ./local or klazy copy ./local <pod>:/path');
  }
}

module.exports = { copyFiles };
