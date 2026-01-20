const { spawnSync } = require('node:child_process');
const {getContexts, selectContext} = require('./misc');
const { getConfig, writeConfig } = require('./config');
const { colorize } = require('./colors');

const useContext = async (targetContext) => {
    const config = getConfig();
    let currentContext;
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

    let newContext;

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

    config.previousContext = currentContext;
    writeConfig(config);

    spawnSync('kubectl', ['config', 'use-context', newContext], {stdio: 'inherit'});
    console.log(`Switched to context: ${colorize(newContext, 'cyan')}`);
}

const showCurrentContext = () => {
    const contexts = getContexts();
    const current = contexts.find(c=>c.current);
    if (!current) {
        console.log('No current context found');
        return;
    }
    console.log(`current context: ${colorize(current.name, 'cyan')}`);
}

const showAllContexts = () => {
    spawnSync('kubectl', ['config', 'get-contexts'], {stdio: 'inherit'});
}

module.exports = {useContext, showCurrentContext, showAllContexts};
