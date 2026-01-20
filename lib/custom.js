"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCustomCommand = exports.isCustomCommand = exports.isCustomConfigValid = exports.isValidCustomCommand = void 0;
const node_child_process_1 = require("node:child_process");
const config_1 = require("./config");
const misc_1 = require("./misc");
const ALLOWED_KUBECTL_COMMANDS = ['get', 'describe', 'logs', 'exec', 'port-forward', 'top', 'rollout'];
const isBoolean = (val) => val === true || val === false;
const isValidCustomCommand = (cmd) => {
    if (!cmd || typeof cmd !== 'object') {
        return false;
    }
    const { name, repeatable, resource, command, flags, description } = cmd;
    return typeof name === 'string' && isBoolean(repeatable) &&
        (resource === 'pod' || resource === 'service') && typeof command === 'string' && typeof flags === 'string' &&
        (typeof description === 'string' || (Array.isArray(description) && description.every(el => typeof el === 'string')));
};
exports.isValidCustomCommand = isValidCustomCommand;
exports.isCustomConfigValid = (() => {
    const config = config_1.configuration.get();
    const commands = config?.[config_1.customCommandsKey];
    if (!commands) {
        return false;
    }
    if (!Array.isArray(commands) || !commands.length) {
        return false;
    }
    for (const cmd of commands) {
        if (!(0, exports.isValidCustomCommand)(cmd)) {
            console.log('invalid custom command definition (skipping all custom commands)');
            return false;
        }
    }
    return true;
})();
const isCustomCommand = (commandName) => {
    if (!exports.isCustomConfigValid) {
        return false;
    }
    const config = config_1.configuration.get();
    const commands = config?.[config_1.customCommandsKey];
    return commands?.some(c => c.name === commandName) ?? false;
};
exports.isCustomCommand = isCustomCommand;
const runCustomCommand = async (commandName, allNamespaces = false) => {
    if (!exports.isCustomConfigValid) {
        console.log(`cannot run command ${commandName}, configuration is invalid`);
        return;
    }
    const config = config_1.configuration.get();
    const commands = config?.[config_1.customCommandsKey];
    const commandDefinition = commands.find(c => c.name === commandName);
    if (!commandDefinition) {
        console.log(`cannot run command ${commandName}, command does not exist`);
        return;
    }
    const { repeatable, resource, command, flags, description } = commandDefinition;
    // Validate command against whitelist
    if (!ALLOWED_KUBECTL_COMMANDS.includes(command)) {
        console.log(`cannot run command ${commandName}, kubectl command '${command}' is not allowed`);
        return;
    }
    console.log(description);
    const context = await (0, misc_1.selectContext)();
    const namespace = await (0, misc_1.selectNamespace)(context);
    const selectedResource = await (0, misc_1.selectResource)(resource, context, namespace);
    // Build args array for spawnSync
    const args = [command, `${resource}/${selectedResource}`, '--namespace', namespace, '--context', context];
    // Parse flags safely (split by whitespace, filter empty)
    if (flags && flags.trim()) {
        const flagParts = flags.trim().split(/\s+/).filter(Boolean);
        args.push(...flagParts);
    }
    const cmd = `kubectl ${command} ${resource}/${selectedResource} --namespace ${namespace} --context ${context} ${flags}`;
    if (repeatable) {
        config_1.configuration.put({ [config_1.lastCommandKey]: cmd });
    }
    console.log(cmd);
    (0, node_child_process_1.spawnSync)('kubectl', args, { stdio: 'inherit' });
};
exports.runCustomCommand = runCustomCommand;
//# sourceMappingURL=custom.js.map