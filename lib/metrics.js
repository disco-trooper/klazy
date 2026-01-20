"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showMetrics = showMetrics;
// lib/metrics.ts
const node_child_process_1 = require("node:child_process");
const colors_1 = require("./colors");
async function showMetrics(resourceType = 'pods', allNamespaces = false) {
    const nsFlag = allNamespaces ? '--all-namespaces' : '';
    const type = resourceType === 'nodes' ? 'nodes' : 'pods';
    try {
        (0, node_child_process_1.execSync)(`kubectl top ${type} ${nsFlag}`, { stdio: 'inherit' });
    }
    catch (err) {
        console.log((0, colors_1.colorize)('Failed to get metrics. Is metrics-server running?', 'yellow'));
        console.log('Install: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml');
    }
}
//# sourceMappingURL=metrics.js.map