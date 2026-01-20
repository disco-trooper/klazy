"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeatLastCommand = void 0;
const config_1 = require("./config");
const node_child_process_1 = require("node:child_process");
// Dangerous characters that could indicate command injection
const DANGEROUS_CHARS = /[;&|`$()]/;
/**
 * Validates that a command is safe to execute
 */
const isValidCommand = (command) => {
    if (!command || typeof command !== 'string') {
        return false;
    }
    // Must start with 'kubectl '
    if (!command.startsWith('kubectl ')) {
        return false;
    }
    // Must not contain dangerous shell characters
    if (DANGEROUS_CHARS.test(command)) {
        return false;
    }
    return true;
};
/**
 * Parses a kubectl command string into args array
 * @param command - Full kubectl command string (e.g., "kubectl get pods -n default")
 * @returns Array of arguments to pass to spawnSync
 */
const parseKubectlCommand = (command) => {
    // Remove 'kubectl ' prefix and split by whitespace
    const withoutKubectl = command.slice('kubectl '.length);
    return withoutKubectl.split(/\s+/).filter(Boolean);
};
const repeatLastCommand = () => {
    const config = config_1.configuration.get();
    const command = config?.[config_1.lastCommandKey];
    if (!command) {
        console.log('no command to repeat');
        return;
    }
    // Validate command before execution
    if (!isValidCommand(command)) {
        console.log('stored command is invalid or potentially unsafe');
        return;
    }
    console.log('repeating last executed command');
    console.log(command);
    const args = parseKubectlCommand(command);
    (0, node_child_process_1.spawnSync)('kubectl', args, { stdio: 'inherit' });
};
exports.repeatLastCommand = repeatLastCommand;
//# sourceMappingURL=repeat-command.js.map