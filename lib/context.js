const cp = require('child_process');
const {getContexts, selectContext} = require('./misc');
const { getConfig, writeConfig } = require('./config');
const { colorize } = require('./colors');

const useContext = async (targetContext) => {
    const config = getConfig();
    const currentContext = cp.execSync('kubectl config current-context', { encoding: 'utf8' }).trim();

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

    cp.execSync(`kubectl config use-context ${newContext}`);
    console.log(`Switched to context: ${colorize(newContext, 'cyan')}`);
}

const showCurrentContext = () => {
    const contexts = getContexts();
    const current = contexts.find(c=>c.current);
    console.log(`current context: ${colorize(current.name, 'cyan')}`);
}

const showAllContexts = () => {
    cp.execSync('kubectl config get-contexts', {stdio: 'inherit'});
}

module.exports = {useContext, showCurrentContext, showAllContexts};