const { spawn } = require('child_process');
const { selectContext, selectNamespace, selectResource } = require('./misc');

/**
 * Stream logs from a pod or service
 * @param {'pod'|'service'} resourceType
 * @param {boolean} follow - whether to follow logs (-f flag)
 */
async function streamLogs(resourceType, follow = true) {
    const context = await selectContext();
    const namespace = await selectNamespace(context);

    let podName;

    if (resourceType === 'service') {
        // For service, first select the service, then get its pods
        const service = await selectResource('service', context, namespace);
        // Get pods for this service using label selector
        const { execSync } = require('child_process');
        const selectorRaw = execSync(
            `kubectl get service ${service} --namespace ${namespace} --context ${context} -o jsonpath='{.spec.selector}'`,
            { encoding: 'utf-8' }
        );

        // Parse selector and get pods
        const selector = JSON.parse(selectorRaw.replace(/'/g, '"'));
        const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');

        const podsRaw = execSync(
            `kubectl get pods --namespace ${namespace} --context ${context} -l "${labelSelector}" -o jsonpath='{.items[*].metadata.name}'`,
            { encoding: 'utf-8' }
        );

        const pods = podsRaw.trim().split(/\s+/).filter(Boolean);

        if (pods.length === 0) {
            console.log('No pods found for this service');
            return;
        }

        if (pods.length === 1) {
            podName = pods[0];
        } else {
            // Multiple pods - let user select
            const { select } = require('./cli');
            podName = await select({
                question: 'select pod',
                options: pods,
                autocomplete: true
            });
        }
    } else {
        podName = await selectResource('pod', context, namespace);
    }

    const args = ['logs', podName, '--namespace', namespace, '--context', context];

    if (follow) {
        args.push('-f');
    }

    console.log(`Running: kubectl ${args.join(' ')}`);

    const proc = spawn('kubectl', args, { stdio: 'inherit' });

    proc.on('close', (code) => {
        if (code !== 0) {
            console.log(`\nLogs ended (code ${code})`);
        }
    });
}

module.exports = { streamLogs };
