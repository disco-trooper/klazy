import { configuration, customCommandsKey } from "./config";
import { isCustomConfigValid } from "./custom";
import type { CustomCommand } from './types';

const HELP_PAD_WIDTH = 18;

type OptionDescription = string | string[];

const optionMap: Record<string, OptionDescription> = {
    'c': 'select context',
    'c <name>': 'switch to context directly',
    'c -': 'switch to previous context',
    'cs': 'show name of an active context',
    'csa': 'show all contexts',
    'ns': 'select namespace interactively',
    'ns <name>': 'switch to namespace directly',
    'ns -': 'switch to previous namespace',
    'pf': 'port forward pod',
    'pf -p': 'port forward with context/ns picker (laku style)',
    'pfs': 'port forward service',
    'pfs -p': 'port forward service with context/ns picker',
    'logs': ['stream logs from a pod (follows by default)', 'use --no-follow for one-shot output'],
    'logs -p': 'logs with context/ns picker (laku style)',
    'logss': 'stream logs from a service pod',
    'logss -p': 'service logs with context/ns picker',
    'get': 'List resources interactively',
    'get pods': 'List pods (aliases: po, pod)',
    'get deploy': 'List deployments (aliases: deployment)',
    'get svc': 'List services (aliases: service)',
    'get pvc': 'List persistent volume claims',
    'get ns': 'List namespaces',
    'get nodes': 'List nodes (aliases: node)',
    'get -a': 'List from all namespaces',
    'get -p': 'List with context/ns picker',
    'exec': 'exec into pod interactively',
    'exec <name>': 'exec into pod matching name (fuzzy)',
    'exec -a': 'exec from all namespaces',
    'exec -p': 'exec with context/ns picker (laku style)',
    'desc': 'describe pod interactively',
    'desc <name>': 'describe pod matching name (fuzzy)',
    'desc -a': 'describe from all namespaces',
    'desc -p': 'describe with context/ns picker',
    'env': 'show env variables from pod',
    'env <name>': 'show env from pod (fuzzy match)',
    'env -a': 'show env from all namespaces',
    'env -p': 'show env with context/ns picker',
    'events': 'show recent events',
    'events -a': 'show events from all namespaces',
    'ev': 'alias for events',
    'restart': 'restart pod (delete, let k8s recreate)',
    'restart <name>': 'restart pod matching name',
    'restart -a': 'restart from all namespaces',
    'copy': 'Interactive file copy',
    'copy <pod>:/p .': 'Copy from pod to local',
    'copy . <pod>:/p': 'Copy from local to pod',
    'cp': 'Alias for copy',
    'del': 'Delete pod with confirmation',
    'del <name>': 'Delete pod matching name',
    'del -f': 'Force delete without confirm',
    'del -a': 'Delete from all namespaces',
    'top': 'Show pod metrics',
    'top nodes': 'Show node metrics',
    'top -a': 'All namespaces',
    'r': ['repeat last executed kubectl command', 'only for commands run via klazy pf, klazy pfs, klazy get'],
    'h': 'help',
    'completion zsh': 'Output zsh completion script',
};

const validArgs: string[] = Object.keys(optionMap);

const printHelp = (): void => {
    console.log('kl/klazy - fuzzy kubectl wrapper for easier usage of common kubectl commands');
    console.group('options:');
    validArgs.forEach(option => {
        const description = optionMap[option];
        printOne(option, description);
    });
    printCustomCommands()
    console.groupEnd();
};

const printCustomCommands = (): void => {
    if(!isCustomConfigValid) {
        return
    }
    const customCommands = configuration.get()[customCommandsKey] ?? [];
    if (!customCommands.length) return;
    console.log()
    console.log('--- custom commands ---')
    customCommands.forEach(({name, description}) => {
        printOne(name, description);
    })
}

const printOne = (commandName: string, description: OptionDescription): void => {
    const padWidth = HELP_PAD_WIDTH;
    if (Array.isArray(description)) {
        description.forEach((item, i) => {
            if (i === 0) {
                console.log(commandName.padEnd(padWidth), item);
                return;
            }
            console.log(''.padEnd(padWidth), item);
        })
        return;
    }

    console.log(commandName.padEnd(padWidth), description);
}

export { printHelp };
