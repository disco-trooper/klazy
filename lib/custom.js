const { spawnSync } = require('node:child_process');
const { configuration, customCommandsKey, lastCommandKey } = require("./config");
const { selectContext, selectNamespace, selectResource, selectPort } = require("./misc");

const ALLOWED_KUBECTL_COMMANDS = ['get', 'describe', 'logs', 'exec', 'port-forward', 'top', 'rollout'];

const isBoolean = (val) => val === true || val === false;

const isCustomConfigValid = (() => {
    const commands = configuration.get()?.[customCommandsKey];
    if (!commands) {
        return false;
    }
    if (!Array.isArray(commands) || !commands.length) {
        return false;
    }

    for (const {name, repeatable, resource, command, flags, description} of commands) {
        const valid = typeof name === 'string' && isBoolean(repeatable) &&
            (resource === 'pod' || resource === 'service') && typeof command === 'string' && typeof flags === 'string' &&
            (typeof description === 'string' || (Array.isArray(description) && description.every(el => typeof el === 'string')));
        if (!valid) {
            console.log('invalid custom command definition (skipping all custom commands)');
            return false;
        }
    }
    return true;

})();

const isCustomCommand = (commandName) => {
    if (!isCustomConfigValid) {
        return false;
    }
    const commands = configuration.get()?.[customCommandsKey];
    return commands.some(c => c.name === commandName);
};

const runCustomCommand = async (commandName) => {
    if (!isCustomConfigValid) {
        console.log(`cannot run command ${commandName}, configuration is invalid`);
        return;
    }
    const commands = configuration.get()?.[customCommandsKey];
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
    const context = await selectContext();
    const namespace = await selectNamespace(context);
    const selectedResource = await selectResource(resource, context, namespace);

    // Build args array for spawnSync
    const args = [command, `${resource}/${selectedResource}`, '--namespace', namespace, '--context', context];

    // Parse flags safely (split by whitespace, filter empty)
    if (flags && flags.trim()) {
        const flagParts = flags.trim().split(/\s+/).filter(Boolean);
        args.push(...flagParts);
    }

    const cmd = `kubectl ${command} ${resource}/${selectedResource} --namespace ${namespace} --context ${context} ${flags}`;
    if (repeatable) {
        configuration.put({[lastCommandKey]: cmd});
    }
    console.log(cmd);
    spawnSync('kubectl', args, {stdio: 'inherit'});
};

module.exports = { isCustomConfigValid, isCustomCommand, runCustomCommand };
