import { spawnSync } from 'node:child_process';
import { getContexts, selectContext } from './misc';
import { getConfig, writeConfig } from './config';
import { colorize } from './colors';

export async function useContext(targetContext?: string): Promise<void> {
    const config = getConfig();
    let currentContext: string;
    try {
        const result = spawnSync('kubectl', ['config', 'current-context'], { encoding: 'utf8' });
        if (result.status !== 0) {
            console.log('Failed to get current context');
            return;
        }
        currentContext = result.stdout.trim();
    } catch (err) {
        console.log('Failed to get current context');
        return;
    }

    let newContext: string | undefined;

    if (targetContext === '-') {
        if (!config.previousContext) {
            console.log('No previous context to switch to');
            return;
        }
        newContext = config.previousContext;
    } else if (targetContext) {
        newContext = targetContext;
    } else {
        // existing interactive selection code
        newContext = await selectContext();
    }

    if (!newContext) {
        return;
    }

    config.previousContext = currentContext;
    writeConfig(config);

    const result = spawnSync('kubectl', ['config', 'use-context', newContext], { encoding: 'utf8' });
    if (result.status !== 0) {
        console.log(`Failed to switch context: ${result.stderr?.trim() || 'unknown error'}`);
        return;
    }
    console.log(`Switched to context: ${colorize(newContext, 'cyan')}`);
}

export function showCurrentContext(): void {
    const contexts = getContexts();
    const current = contexts.find((c) => c.current);
    if (!current) {
        console.log('No current context found');
        return;
    }
    console.log(`current context: ${colorize(current.name, 'cyan')}`);
}

export function showAllContexts(): void {
    spawnSync('kubectl', ['config', 'get-contexts'], { stdio: 'inherit' });
}
