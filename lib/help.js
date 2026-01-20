const {configuration, customCommandsKey} = require("./config");
const {isCustomConfigValid} = require("./custom");


const optionMap = {
    'c': 'select context',
    'c <name>': 'switch to context directly',
    'c -': 'switch to previous context',
    'cs': 'show name of an active context',
    'csa': 'show all contexts',
    'ns': 'select namespace interactively',
    'ns <name>': 'switch to namespace directly',
    'ns -': 'switch to previous namespace',
    'pf': 'port forward',
    'pfs': 'port backward (service)',
    'logs': ['stream logs from a pod (follows by default)', 'use --no-follow for one-shot output'],
    'logss': 'stream logs from a service pod',
    'get': 'get resources (pods / services)',
    'exec': 'exec into pod interactively',
    'exec <name>': 'exec into pod matching name (fuzzy)',
    'exec -a': 'exec from all namespaces',
    'desc': 'describe pod interactively',
    'desc <name>': 'describe pod matching name (fuzzy)',
    'desc -a': 'describe from all namespaces',
    'env': 'show env variables from pod',
    'env <name>': 'show env from pod (fuzzy match)',
    'env -a': 'show env from all namespaces',
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
    'r': ['repeat last executed kubectl command', 'only for commands run via klazy pf, klazy pfs, klazy get'],
    'h': 'help',
};

const validArgs = Object.keys(optionMap);

const printHelp = () => {
    console.log('klazy (lazy kubectl) is a command line (semi)interactive tool for easier usage of some kubectl commands');
    console.group('options:');
    validArgs.forEach(option => {
        const description = optionMap[option];
        printOne(option, description);
    });
    printCustomCommands()
    console.groupEnd();
};

const printCustomCommands = () => {
    if(!isCustomConfigValid) {
        return
    }
    const customCommands = configuration.get()[customCommandsKey]
    console.log()
    console.log('--- custom commands ---')
    customCommands.forEach(({name, description}) => {
        printOne(name, description);
    })
}

const printOne = (commandName, description) => {
    if (Array.isArray(description)) {
        description.forEach((item, i) => {
            if (i === 0) {
                console.log(commandName.padEnd(5), item);
                return;
            }
            console.log(''.padEnd(5), item);
        })
        return;
    }

    console.log(commandName.padEnd(5), description);
}

module.exports = {printHelp};