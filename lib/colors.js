"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLORS = void 0;
exports.colorize = colorize;
exports.colorizeStatus = colorizeStatus;
exports.logError = logError;
exports.logWarning = logWarning;
const RESET = '\x1b[0m';
const COLORS = {
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};
exports.COLORS = COLORS;
function colorize(text, color) {
    const colorCode = COLORS[color];
    if (!colorCode)
        return text;
    return `${colorCode}${text}${RESET}`;
}
function colorizeStatus(status) {
    const statusColors = {
        'Running': 'green',
        'Pending': 'yellow',
        'Waiting': 'yellow',
        'ContainerCreating': 'cyan',
        'Error': 'red',
        'CrashLoopBackOff': 'red',
        'ImagePullBackOff': 'red',
        'Completed': 'gray',
        'Terminated': 'gray',
        'Succeeded': 'green',
        'Failed': 'red',
        'True': 'green',
        'False': 'red',
        'Normal': 'green',
        'Warning': 'yellow',
    };
    const color = statusColors[status] || 'gray';
    return colorize(status, color);
}
function logError(action, detail) {
    const message = detail ? `Failed to ${action}: ${detail}` : `Failed to ${action}`;
    console.log(colorize(message, 'red'));
}
function logWarning(message) {
    console.log(colorize(message, 'yellow'));
}
//# sourceMappingURL=colors.js.map