// lib/metrics.js
const { execSync } = require('node:child_process');
const { colorize } = require('./colors');

async function showMetrics(resourceType = 'pods', allNamespaces = false) {
  const nsFlag = allNamespaces ? '--all-namespaces' : '';
  const type = resourceType === 'nodes' ? 'nodes' : 'pods';

  try {
    execSync(`kubectl top ${type} ${nsFlag}`, { stdio: 'inherit' });
  } catch (err) {
    console.log(colorize('Failed to get metrics. Is metrics-server running?', 'yellow'));
    console.log('Install: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml');
  }
}

module.exports = { showMetrics };
