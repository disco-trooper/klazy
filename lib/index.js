#!/usr/bin/env node

const {useContext, showCurrentContext, showAllContexts} = require('./context');
const {printHelp} = require('./help');
const {portForward} = require('./port-forward');
const {getResources} = require('./get-resources');
const {repeatCommand} = require("./repeat-command");
const {isCustomCommand, runCustomCommand} = require("./custom");
const {streamLogs} = require('./logs');

const main = async () => {
    const args = process.argv.slice(2);
    const flags = {
        allNamespaces: args.includes('-a') || args.includes('--all-namespaces'),
        force: args.includes('-f') || args.includes('--force'),
        noFollow: args.includes('--no-follow'),
    };
    const cmd = args.find(a => !a.startsWith('-'));

    if (!cmd) {
        printHelp();
        return;
    }

    switch (cmd) {
        case 'c':
            const ctxArg = args.find((a, i) => i > args.indexOf('c') && (!a.startsWith('-') || a === '-'));
            await useContext(ctxArg);
            break;
        case 'cs':
            showCurrentContext();
            break;
        case 'csa':
            showAllContexts();
            break;
        case 'pf':
            await portForward('pod');
            break;
        case 'get':
            const resourceType = args.find((a, i) => i > args.indexOf('get') && !a.startsWith('-'));
            await getResources(resourceType, flags.allNamespaces);
            break;
        case 'pfs':
            await portForward('service');
            break;
        case 'logs':
            await streamLogs('pod', !flags.noFollow);
            break;
        case 'logss':
            await streamLogs('service', !flags.noFollow);
            break;
        case 'ns':
            const { useNamespace } = require('./namespace');
            const nsArg = args.find((a, i) => i > args.indexOf('ns') && (!a.startsWith('-') || a === '-'));
            await useNamespace(nsArg);
            break;
        case 'exec':
            const { execIntoPod } = require('./exec');
            const execSearch = args.find((a, i) => i > args.indexOf('exec') && !a.startsWith('-'));
            await execIntoPod(execSearch, flags.allNamespaces);
            break;
        case 'desc':
            const { describePod } = require('./describe');
            const descSearch = args.find((a, i) => i > args.indexOf('desc') && !a.startsWith('-'));
            await describePod(descSearch, flags.allNamespaces);
            break;
        case 'env':
            const { showEnv } = require('./env');
            const envSearch = args.find((a, i) => i > args.indexOf('env') && !a.startsWith('-'));
            await showEnv(envSearch, flags.allNamespaces);
            break;
        case 'events':
        case 'ev':
            const { showEvents } = require('./events');
            await showEvents(flags.allNamespaces);
            break;
        case 'restart':
            const { restartPod } = require('./restart');
            const restartSearch = args.find((a, i) => i > args.indexOf('restart') && !a.startsWith('-'));
            await restartPod(restartSearch, flags.allNamespaces);
            break;
        case 'cp':
        case 'copy':
            const { copyFiles } = require('./copy');
            const copyArgs = args.filter((a, i) => i > args.indexOf(cmd) && !a.startsWith('-'));
            await copyFiles(copyArgs[0], copyArgs[1], flags.allNamespaces);
            break;
        case 'del':
        case 'delete':
            const { deletePod } = require('./delete');
            const delSearch = args.find((a, i) => i > args.indexOf(cmd) && !a.startsWith('-'));
            await deletePod(delSearch, flags.allNamespaces, flags.force);
            break;
        case 'r':
            repeatCommand()
            break;
        case 'top':
        case 'metrics':
            const { showMetrics } = require('./metrics');
            const metricsType = args.find((a, i) => i > args.indexOf(cmd) && !a.startsWith('-')) || 'pods';
            await showMetrics(metricsType, flags.allNamespaces);
            break;
        case 'completion':
            const { outputCompletion } = require('./completion');
            const shell = args.find((a, i) => i > args.indexOf('completion') && !a.startsWith('-'));
            outputCompletion(shell);
            break;
        case 'h':
            printHelp();
            break;
        default:
            if(isCustomCommand(cmd)) {
                await runCustomCommand(cmd)
                return
            }
            console.log('unsupported cmd line agrument:', cmd);
            printHelp();
    }
};

main().catch((e) => console.log(e));