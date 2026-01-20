import { spawnSync } from 'node:child_process';
import { select, input } from './cli';
import { fuzzyFilter } from './fuzzy';
import type { Context, Pod } from './types';

const SELECTED_CONTEXT_REGEX = /^\s*\*/;
const MAX_PORT = 65535;

/**
 * Get all kubectl contexts
 */
export function getContexts(): Context[] {
    const result = spawnSync('kubectl', ['config', 'get-contexts'], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return [];
    }
    const namespacesRaw = result.stdout;
    const split = namespacesRaw.trim().split('\n');
    split.shift();
    return split.map(line => {
        const current = SELECTED_CONTEXT_REGEX.test(line);
        const lineSplit = current ? line.split(SELECTED_CONTEXT_REGEX)[1].trim().split(/\s/) : line.trim().split(/\s/);
        return { name: lineSplit[0], current };
    });
}

/**
 * Interactive context selection
 */
export function selectContext(): Promise<string> {
    const contexts = getContexts();
    const selectedContext = contexts.findIndex(c => c.current);
    const contextNames = contexts.map(c => c.name);
    return select({ question: 'select context', options: contextNames, pointer: selectedContext });
}

/**
 * Interactive namespace selection for a given context
 */
export function selectNamespace(context: string): Promise<string> {
    const result = spawnSync('kubectl', ['get', 'ns', '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return select({ question: 'select namespace', options: [], autocomplete: true });
    }
    const nsRaw = result.stdout;
    const nsSplit = nsRaw.trim().split('\n');
    nsSplit.shift();
    const namespaces = nsSplit
      .map(s => s.trim().split(/\s/)[0])
      .filter((name): name is string => Boolean(name));
    return select({ question: 'select namespace', options: namespaces, autocomplete: true });
}

/**
 * Interactive resource selection
 */
export function selectResource(resource: string, context: string, namespace: string): Promise<string> {
    const result = spawnSync('kubectl', ['get', `${resource}s`, '--namespace', namespace, '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return select({ question: `select ${resource}`, options: [], autocomplete: true });
    }
    const podsRaw = result.stdout;
    const resourceSplit = podsRaw.trim().split('\n');
    resourceSplit.shift();
    const resources = resourceSplit
      .map(s => s.trim().split(/\s/)[0])
      .filter((name): name is string => Boolean(name));
    return select({ question: `select ${resource}`, options: resources, autocomplete: true });
}

/**
 * Validate port number
 */
export function validatePort(value: string): boolean {
    const numVal = Number(value);
    return !isNaN(numVal) && numVal >= 0 && numVal <= MAX_PORT;
}

/**
 * Interactive port selection with validation
 */
export function selectPort(question: string): Promise<string> {
    return input({
        question,
        defaultValue: '8080',
        invalidWarning: 'valid ports are numbers in range [0,65535]',
        validationCallback: validatePort,
    });
}

/**
 * Interactive pod selection with optional fuzzy search
 */
export async function selectPod(
  pods: Pod[],
  searchTerm: string | undefined,
  allNamespaces: boolean,
  question: string = 'Select pod:'
): Promise<Pod | undefined> {
  if (pods.length === 0) {
    console.log('No pods found');
    return undefined;
  }

  const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);

  if (searchTerm) {
    const filtered = fuzzyFilter(podNames, searchTerm);
    if (filtered.length === 0) {
      console.log(`No pods matching "${searchTerm}"`);
      return undefined;
    }
    if (filtered.length === 1) {
      return pods[filtered[0].originalIndex];
    }
    const displayNames = filtered.map(f => podNames[f.originalIndex]);
    const selected = await select({ question, options: displayNames, autocomplete: true });
    if (!selected) return undefined;
    const idx = displayNames.indexOf(selected);
    if (idx === -1) return undefined;
    return pods[filtered[idx].originalIndex];
  }

  const selected = await select({ question, options: podNames, autocomplete: true });
  if (!selected) return undefined;
  const idx = podNames.indexOf(selected);
  if (idx === -1) return undefined;
  return pods[idx];
}
