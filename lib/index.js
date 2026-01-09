#!/usr/bin/env node

const {useContext, showCurrentContext, showAllContexts} = require('./context');
const {printHelp} = require('./help');
const {portForward} = require('./port-forward');
const {getResources} = require('./get-resources');
const {repeatCommand} = require("./repeat-command");
const {isCustomCommand, runCustomCommand} = require("./custom");
const {streamLogs} = require('./logs');

const main = async () => {

    const cmdArgs = process.argv.slice(2);
    if (cmdArgs.length === 0) {
        printHelp();
        return;
    }
    const arg = cmdArgs[0];
    const hasNoFollow = cmdArgs.includes('--no-follow');
    switch (arg) {
        case 'c':
            await useContext();
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
            await streamLogs('pod', !hasNoFollow);
            break;
        case 'logss':
            await streamLogs('service', !hasNoFollow);
            break;
        case 'r':
            repeatCommand()
            break;
        case 'h':
            printHelp();
            break;
        default:
            if(isCustomCommand(arg)) {
                await runCustomCommand(arg)
                return
            }
            console.log('unsupported cmd line agrument:', arg);
            printHelp();
    }
};

main().catch((e) => console.log(e));