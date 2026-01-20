// lib/namespace.ts
import { spawnSync } from 'node:child_process';
import { select } from './cli';
import { getConfig, writeConfig } from './config';
import { colorize } from './colors';

export function getNamespaces(): string[] {
  const result = spawnSync('kubectl', ['get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}'], { encoding: 'utf8' });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout.trim().split(' ').filter(Boolean);
}

export function getCurrentNamespace(): string {
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

function setNamespace(ns: string): void {
  spawnSync('kubectl', ['config', 'set-context', '--current', `--namespace=${ns}`], { encoding: 'utf8' });
}

export async function useNamespace(targetNs?: string): Promise<void> {
  const config = getConfig();
  const currentNs = getCurrentNamespace();

  let newNs: string;

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
