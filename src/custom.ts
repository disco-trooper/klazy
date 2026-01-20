import { spawnSync } from 'node:child_process';
import { configuration, customCommandsKey, lastCommandKey } from "./config";
import { selectContext, selectNamespace, selectResource } from "./misc";
import type { CustomCommand } from './types';

const ALLOWED_KUBECTL_COMMANDS: string[] = ['get', 'describe', 'logs', 'exec', 'port-forward', 'top', 'rollout'];

const isBoolean = (val: unknown): val is boolean => val === true || val === false;

export const isValidCustomCommand = (cmd: unknown): cmd is CustomCommand => {
    if (!cmd || typeof cmd !== 'object') {
        return false;
    }
    const { name, repeatable, resource, command, flags, description } = cmd as Record<string, unknown>;
    return typeof name === 'string' && isBoolean(repeatable) &&
        (resource === 'pod' || resource === 'service') && typeof command === 'string' && typeof flags === 'string' &&
        (typeof description === 'string' || (Array.isArray(description) && description.every(el => typeof el === 'string')));
};

const isCustomConfigValid = ((): boolean => {
    const config = configuration.get();
    const commands = config?.[customCommandsKey];
    if (!commands) {
        return false;
    }
    if (!Array.isArray(commands) || !commands.length) {
        return false;
    }

    for (const cmd of commands) {
        if (!isValidCustomCommand(cmd)) {
            console.log('invalid custom command definition (skipping all custom commands)');
            return false;
        }
    }
    return true;

})();

export const isCustomCommand = (commandName: string): boolean => {
    if (!isCustomConfigValid) {
        return false;
    }
    const config = configuration.get();
    const commands = config?.[customCommandsKey] as CustomCommand[] | undefined;
    return commands?.some(c => c.name === commandName) ?? false;
};

export const runCustomCommand = async (commandName: string, allNamespaces: boolean = false): Promise<void> => {
    if (!isCustomConfigValid) {
        console.log(`cannot run command ${commandName}, configuration is invalid`);
        return;
    }
    const config = configuration.get();
    const commands = config?.[customCommandsKey] as CustomCommand[];
    const commandDefinition = commands.find(c => c.name === commandName);
    if (!commandDefinition) {
        console.log(`cannot run command ${commandName}, command does not exist`);
        return;
    }

    const { repeatable, resource, command, flags, description } = commandDefinition;

    // Validate command against whitelist
    if (!ALLOWED_KUBECTL_COMMANDS.includes(command)) {
        console.log(`cannot run command ${commandName}, kubectl command '${command}' is not allowed`);
        return;
    }

    console.log(description);
    const context = await selectContext();
    const namespace = await selectNamespace(context);
    const selectedResource = await selectResource(resource, context, namespace);

    // Build args array for spawnSync
    const args: string[] = [command, `${resource}/${selectedResource}`, '--namespace', namespace, '--context', context];

    // Parse flags safely (split by whitespace, filter empty)
    if (flags && flags.trim()) {
        const flagParts = flags.trim().split(/\s+/).filter(Boolean);
        args.push(...flagParts);
    }

    const cmd = `kubectl ${command} ${resource}/${selectedResource} --namespace ${namespace} --context ${context} ${flags}`;
    if (repeatable) {
        configuration.put({[lastCommandKey]: cmd});
    }
    console.log(cmd);
    spawnSync('kubectl', args, {stdio: 'inherit'});
};
