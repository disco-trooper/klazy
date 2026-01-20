#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("./context");
const help_1 = require("./help");
const port_forward_1 = require("./port-forward");
const get_resources_1 = require("./get-resources");
const repeat_command_1 = require("./repeat-command");
const custom_1 = require("./custom");
const logs_1 = require("./logs");
const namespace_1 = require("./namespace");
const exec_1 = require("./exec");
const describe_1 = require("./describe");
const env_1 = require("./env");
const events_1 = require("./events");
const restart_1 = require("./restart");
const copy_1 = require("./copy");
const delete_1 = require("./delete");
const metrics_1 = require("./metrics");
const completion_1 = require("./completion");
const main = async () => {
    const args = process.argv.slice(2);
    const flags = {
        allNamespaces: args.includes('-a') || args.includes('--all-namespaces'),
        force: args.includes('-f') || args.includes('--force'),
        noFollow: args.includes('--no-follow'),
    };
    const cmd = args.find((a) => !a.startsWith('-'));
    if (!cmd) {
        (0, help_1.printHelp)();
        return;
    }
    switch (cmd) {
        case 'c':
            const ctxArg = args.find((a, i) => i > args.indexOf('c') && (!a.startsWith('-') || a === '-'));
            await (0, context_1.useContext)(ctxArg);
            break;
        case 'cs':
            (0, context_1.showCurrentContext)();
            break;
        case 'csa':
            (0, context_1.showAllContexts)();
            break;
        case 'pf':
            await (0, port_forward_1.portForward)('pod', flags.allNamespaces);
            break;
        case 'get':
            const resourceType = args.find((a, i) => i > args.indexOf('get') && !a.startsWith('-')) || 'pods';
            await (0, get_resources_1.getResources)(resourceType, flags.allNamespaces);
            break;
        case 'pfs':
            await (0, port_forward_1.portForward)('service', flags.allNamespaces);
            break;
        case 'logs':
            const logsSearch = args.find((a, i) => i > args.indexOf('logs') && !a.startsWith('-'));
            await (0, logs_1.streamLogs)('pod', logsSearch, flags.allNamespaces, !flags.noFollow);
            break;
        case 'logss':
            const logssSearch = args.find((a, i) => i > args.indexOf('logss') && !a.startsWith('-'));
            await (0, logs_1.streamLogs)('service', logssSearch, flags.allNamespaces, !flags.noFollow);
            break;
        case 'ns':
            const nsArg = args.find((a, i) => i > args.indexOf('ns') && (!a.startsWith('-') || a === '-'));
            await (0, namespace_1.useNamespace)(nsArg);
            break;
        case 'exec':
            const execSearch = args.find((a, i) => i > args.indexOf('exec') && !a.startsWith('-'));
            await (0, exec_1.execIntoPod)(execSearch, flags.allNamespaces);
            break;
        case 'desc':
            const descSearch = args.find((a, i) => i > args.indexOf('desc') && !a.startsWith('-'));
            await (0, describe_1.describePod)(descSearch, flags.allNamespaces);
            break;
        case 'env':
            const envSearch = args.find((a, i) => i > args.indexOf('env') && !a.startsWith('-'));
            await (0, env_1.showEnv)(envSearch, flags.allNamespaces);
            break;
        case 'events':
        case 'ev':
            await (0, events_1.showEvents)(flags.allNamespaces);
            break;
        case 'restart':
            const restartSearch = args.find((a, i) => i > args.indexOf('restart') && !a.startsWith('-'));
            await (0, restart_1.restartPod)(restartSearch, flags.allNamespaces);
            break;
        case 'cp':
        case 'copy':
            const copyArgs = args.filter((a, i) => i > args.indexOf(cmd) && !a.startsWith('-'));
            await (0, copy_1.copyFiles)(copyArgs[0], copyArgs[1], flags.allNamespaces);
            break;
        case 'del':
        case 'delete':
            const delSearch = args.find((a, i) => i > args.indexOf(cmd) && !a.startsWith('-'));
            await (0, delete_1.deletePod)(delSearch, flags.allNamespaces, flags.force);
            break;
        case 'r':
            (0, repeat_command_1.repeatLastCommand)();
            break;
        case 'top':
        case 'metrics':
            const metricsType = args.find((a, i) => i > args.indexOf(cmd) && !a.startsWith('-')) || 'pods';
            await (0, metrics_1.showMetrics)(metricsType, flags.allNamespaces);
            break;
        case 'completion':
            const shell = args.find((a, i) => i > args.indexOf('completion') && !a.startsWith('-')) || '';
            (0, completion_1.outputCompletion)(shell);
            break;
        case 'h':
            (0, help_1.printHelp)();
            break;
        default:
            if ((0, custom_1.isCustomCommand)(cmd)) {
                await (0, custom_1.runCustomCommand)(cmd);
                return;
            }
            console.log('unsupported command line argument:', cmd);
            (0, help_1.printHelp)();
    }
};
main().catch((e) => console.log(e));
//# sourceMappingURL=index.js.map