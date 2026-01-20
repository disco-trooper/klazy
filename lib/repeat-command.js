const { configuration, lastCommandKey } = require("./config");
const { spawnSync } = require('node:child_process');

// Dangerous characters that could indicate command injection
const DANGEROUS_CHARS = /[;&|`$()]/;

/**
 * Validates that a command is safe to execute
 * @param {string} command
 * @returns {boolean}
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
 * @param {string} command - Full kubectl command string (e.g., "kubectl get pods -n default")
 * @returns {string[]} - Array of arguments to pass to spawnSync
 */
const parseKubectlCommand = (command) => {
    // Remove 'kubectl ' prefix and split by whitespace
    const withoutKubectl = command.slice('kubectl '.length);
    return withoutKubectl.split(/\s+/).filter(Boolean);
};

const repeatCommand = () => {
    const command = configuration.get()?.[lastCommandKey];
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
    spawnSync('kubectl', args, { stdio: 'inherit' });
};

module.exports = { repeatCommand };
