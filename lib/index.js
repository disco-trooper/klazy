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
            const ctxArg = args.find((a, i) => i > args.indexOf('c') && !a.startsWith('-'));
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
            await getResources();
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
            const nsArg = args.find((a, i) => i > args.indexOf('ns') && !a.startsWith('-'));
            await useNamespace(nsArg);
            break;
        case 'r':
            repeatCommand()
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