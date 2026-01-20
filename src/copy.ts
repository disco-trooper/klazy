// src/copy.ts
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { select, input } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import { colorize } from './colors';
import { getPods } from './exec';
import { selectPod } from './misc';
import type { Pod } from './types';

/**
 * Validates local path doesn't escape via traversal
 */
function isPathSafe(localPath: string): boolean {
  const resolved = path.resolve(localPath);
  const cwd = process.cwd();
  return resolved.startsWith(cwd) || path.isAbsolute(localPath);
}

export async function copyFiles(srcArg: string | undefined, destArg: string | undefined, allNamespaces: boolean = false): Promise<void> {
  const pods = getPods(allNamespaces);
  if (pods.length === 0) {
    console.log('No pods found');
    return;
  }

  // Interactive mode if no args
  if (!srcArg) {
    const selectedPod = await selectPod(pods, undefined, allNamespaces, 'Select pod:');
    if (!selectedPod) return;
    const ns = selectedPod.namespace || getCurrentNamespace();

    const directions = ['From pod to local', 'From local to pod'];
    const directionSel = await select({question: 'Copy direction:', options: directions});
    if (!directionSel) return;
    const direction = directions.indexOf(directionSel);
    if (direction === -1) return;

    const remotePath = await input({question: 'Remote path (in pod)'});
    const localPath = await input({question: 'Local path'});

    if (!isPathSafe(localPath)) {
      console.log(colorize('Warning: Path traversal detected. Use absolute path or path within current directory.', 'yellow'));
      return;
    }

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
    const colonIdx = src.indexOf(':');
    const podPart = src.substring(0, colonIdx);
    const pathPart = src.substring(colonIdx + 1);
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
    const colonIdx = dest.indexOf(':');
    const podPart = dest.substring(0, colonIdx);
    const pathPart = dest.substring(colonIdx + 1);
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
