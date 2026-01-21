#!/usr/bin/env node

import { useContext, showCurrentContext, showAllContexts } from './context';
import { printHelp } from './help';
import { portForward } from './port-forward';
import { getResources } from './get-resources';
import { repeatLastCommand } from './repeat-command';
import { isCustomCommand, runCustomCommand } from './custom';
import { streamLogs } from './logs';
import { useNamespace } from './namespace';
import { execIntoPod } from './exec';
import { describePod } from './describe';
import { showEnv } from './env';
import { showEvents } from './events';
import { restartPod } from './restart';
import { copyFiles } from './copy';
import { deletePod } from './delete';
import { showMetrics } from './metrics';
import { outputCompletion } from './completion';
import type { Flags } from './types';

function extractFlagValue(args: string[], flag: string): string | undefined {
    const idx = args.indexOf(flag);
    if (idx === -1 || idx + 1 >= args.length) return undefined;
    const value = args[idx + 1];
    return value.startsWith('-') ? undefined : value;
}

const main = async (): Promise<void> => {
    const args: string[] = process.argv.slice(2);
    const flags: Flags = {
        allNamespaces: args.includes('-a') || args.includes('--all-namespaces'),
        force: args.includes('-f') || args.includes('--force'),
        noFollow: args.includes('--no-follow'),
        pick: args.includes('-p') || args.includes('--pick'),
        pipe: extractFlagValue(args, '--pipe'),
    };
    const cmd: string | undefined = args.find((a: string) => !a.startsWith('-'));

    if (!cmd) {
        printHelp();
        return;
    }

    switch (cmd) {
        case 'c':
            const ctxArg: string | undefined = args.find((a: string, i: number) => i > args.indexOf('c') && (!a.startsWith('-') || a === '-'));
            await useContext(ctxArg);
            break;
        case 'cs':
            showCurrentContext();
            break;
        case 'csa':
            showAllContexts();
            break;
        case 'pf':
            await portForward('pod', flags.allNamespaces, flags.pick);
            break;
        case 'get':
            const resourceType: string = args.find((a: string, i: number) => i > args.indexOf('get') && !a.startsWith('-')) || 'pods';
            await getResources(resourceType, flags.allNamespaces, flags.pick);
            break;
        case 'pfs':
            await portForward('service', flags.allNamespaces, flags.pick);
            break;
        case 'logs':
            const logsSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf('logs') && !a.startsWith('-') && args[i - 1] !== '--pipe');
            await streamLogs('pod', logsSearch, {
                allNamespaces: flags.allNamespaces,
                follow: !flags.noFollow,
                pick: flags.pick,
                pipeCmd: flags.pipe,
            });
            break;
        case 'logss':
            const logssSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf('logss') && !a.startsWith('-') && args[i - 1] !== '--pipe');
            await streamLogs('service', logssSearch, {
                allNamespaces: flags.allNamespaces,
                follow: !flags.noFollow,
                pick: flags.pick,
                pipeCmd: flags.pipe,
            });
            break;
        case 'ns':
            const nsArg: string | undefined = args.find((a: string, i: number) => i > args.indexOf('ns') && (!a.startsWith('-') || a === '-'));
            await useNamespace(nsArg);
            break;
        case 'exec':
            const execSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf('exec') && !a.startsWith('-'));
            await execIntoPod(execSearch, flags.allNamespaces, flags.pick);
            break;
        case 'desc':
            const descSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf('desc') && !a.startsWith('-'));
            await describePod(descSearch, flags.allNamespaces, flags.pick);
            break;
        case 'env':
            const envSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf('env') && !a.startsWith('-'));
            await showEnv(envSearch, flags.allNamespaces, flags.pick);
            break;
        case 'events':
        case 'ev':
            await showEvents(flags.allNamespaces);
            break;
        case 'restart':
            const restartSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf('restart') && !a.startsWith('-'));
            await restartPod(restartSearch, flags.allNamespaces);
            break;
        case 'cp':
        case 'copy':
            const copyArgs: string[] = args.filter((a: string, i: number) => i > args.indexOf(cmd) && !a.startsWith('-'));
            await copyFiles(copyArgs[0], copyArgs[1], flags.allNamespaces);
            break;
        case 'del':
        case 'delete':
            const delSearch: string | undefined = args.find((a: string, i: number) => i > args.indexOf(cmd) && !a.startsWith('-'));
            await deletePod(delSearch, flags.allNamespaces, flags.force);
            break;
        case 'r':
            repeatLastCommand();
            break;
        case 'top':
        case 'metrics':
            const metricsType: string = args.find((a: string, i: number) => i > args.indexOf(cmd) && !a.startsWith('-')) || 'pods';
            await showMetrics(metricsType, flags.allNamespaces);
            break;
        case 'completion':
            const shell: string = args.find((a: string, i: number) => i > args.indexOf('completion') && !a.startsWith('-')) || '';
            outputCompletion(shell);
            break;
        case 'h':
            printHelp();
            break;
        default:
            if (isCustomCommand(cmd)) {
                await runCustomCommand(cmd);
                return;
            }
            console.log('unsupported command line argument:', cmd);
            printHelp();
    }
};

main().catch((e: unknown) => console.log(e));
