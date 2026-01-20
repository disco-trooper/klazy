// lib/events.js
const { execSync } = require('child_process');
const { colorize } = require('./colors');

function colorizeEventType(type) {
  switch (type) {
    case 'Normal': return colorize(type, 'green');
    case 'Warning': return colorize(type, 'yellow');
    default: return colorize(type, 'red');
  }
}

async function showEvents(allNamespaces = false, limit = 20) {
  const nsFlag = allNamespaces ? '--all-namespaces' : '';

  try {
    const cmd = `kubectl get events ${nsFlag} --sort-by='.lastTimestamp' -o jsonpath='{range .items[*]}{.type}{"\\t"}{.reason}{"\\t"}{.message}{"\\n"}{end}'`;
    const output = execSync(cmd, { encoding: 'utf8' });

    const lines = output.trim().split('\n').filter(Boolean).slice(-limit);

    if (lines.length === 0) {
      console.log('No events found');
      return;
    }

    lines.forEach(line => {
      const [type, reason, message] = line.split('\t');
      const coloredType = colorizeEventType(type);
      const truncatedMsg = message && message.length > 60 ? message.substring(0, 57) + '...' : message;
      console.log(`${coloredType}\t${reason}\t${truncatedMsg || ''}`);
    });
  } catch (err) {
    console.log(colorize('Failed to get events', 'red'));
  }
}

module.exports = { showEvents };
