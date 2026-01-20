"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showEvents = showEvents;
// src/events.ts
const node_child_process_1 = require("node:child_process");
const colors_1 = require("./colors");
const DEFAULT_EVENT_LIMIT = 20;
const MAX_MESSAGE_LENGTH = 60;
const TRUNCATE_LENGTH = 57;
function colorizeEventType(type) {
    switch (type) {
        case 'Normal': return (0, colors_1.colorize)(type, 'green');
        case 'Warning': return (0, colors_1.colorize)(type, 'yellow');
        default: return (0, colors_1.colorize)(type, 'red');
    }
}
async function showEvents(allNamespaces = false, limit = DEFAULT_EVENT_LIMIT) {
    const args = ['get', 'events', '--sort-by=.lastTimestamp', '-o', 'jsonpath={range .items[*]}{.type}{"\\t"}{.reason}{"\\t"}{.message}{"\\n"}{end}'];
    if (allNamespaces)
        args.splice(2, 0, '--all-namespaces');
    const result = (0, node_child_process_1.spawnSync)('kubectl', args, { encoding: 'utf8' });
    if (result.status !== 0) {
        console.log((0, colors_1.colorize)('Failed to get events', 'red'));
        return;
    }
    const lines = result.stdout.trim().split('\n').filter(Boolean).slice(-limit);
    if (lines.length === 0) {
        console.log('No events found');
        return;
    }
    lines.forEach(line => {
        const [type, reason, message] = line.split('\t');
        const coloredType = colorizeEventType(type);
        const truncatedMsg = message && message.length > MAX_MESSAGE_LENGTH ? message.substring(0, TRUNCATE_LENGTH) + '...' : message;
        console.log(`${coloredType}\t${reason}\t${truncatedMsg || ''}`);
    });
}
//# sourceMappingURL=events.js.map