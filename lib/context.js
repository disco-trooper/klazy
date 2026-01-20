"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContext = useContext;
exports.showCurrentContext = showCurrentContext;
exports.showAllContexts = showAllContexts;
const node_child_process_1 = require("node:child_process");
const misc_1 = require("./misc");
const config_1 = require("./config");
const colors_1 = require("./colors");
async function useContext(targetContext) {
    const config = (0, config_1.getConfig)();
    let currentContext;
    try {
        const result = (0, node_child_process_1.spawnSync)('kubectl', ['config', 'current-context'], { encoding: 'utf8' });
        if (result.status !== 0) {
            console.log('Failed to get current context');
            return;
        }
        currentContext = result.stdout.trim();
    }
    catch (err) {
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
    }
    else if (targetContext) {
        newContext = targetContext;
    }
    else {
        // existing interactive selection code
        newContext = await (0, misc_1.selectContext)();
    }
    if (!newContext) {
        return;
    }
    config.previousContext = currentContext;
    (0, config_1.writeConfig)(config);
    (0, node_child_process_1.spawnSync)('kubectl', ['config', 'use-context', newContext], { stdio: 'inherit' });
    console.log(`Switched to context: ${(0, colors_1.colorize)(newContext, 'cyan')}`);
}
function showCurrentContext() {
    const contexts = (0, misc_1.getContexts)();
    const current = contexts.find((c) => c.current);
    if (!current) {
        console.log('No current context found');
        return;
    }
    console.log(`current context: ${(0, colors_1.colorize)(current.name, 'cyan')}`);
}
function showAllContexts() {
    (0, node_child_process_1.spawnSync)('kubectl', ['config', 'get-contexts'], { stdio: 'inherit' });
}
//# sourceMappingURL=context.js.map