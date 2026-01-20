// src/events.ts
import { spawnSync } from 'node:child_process';
import { colorize } from './colors';

function colorizeEventType(type: string): string {
  switch (type) {
    case 'Normal': return colorize(type, 'green');
    case 'Warning': return colorize(type, 'yellow');
    default: return colorize(type, 'red');
  }
}

export async function showEvents(allNamespaces: boolean = false, limit: number = 20): Promise<void> {
  const args = ['get', 'events', '--sort-by=.lastTimestamp', '-o', 'jsonpath={range .items[*]}{.type}{"\\t"}{.reason}{"\\t"}{.message}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  const result = spawnSync('kubectl', args, { encoding: 'utf8' });

  if (result.status !== 0) {
    console.log(colorize('Failed to get events', 'red'));
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
    const truncatedMsg = message && message.length > 60 ? message.substring(0, 57) + '...' : message;
    console.log(`${coloredType}\t${reason}\t${truncatedMsg || ''}`);
  });
}
