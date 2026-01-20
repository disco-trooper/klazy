const RESET = '\x1b[0m';

const COLORS: Record<string, string> = {
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

export function colorize(text: string, color: string): string {
  const colorCode = COLORS[color];
  if (!colorCode) return text;
  return `${colorCode}${text}${RESET}`;
}

export function colorizeStatus(status: string): string {
  const statusColors: Record<string, string> = {
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

export { COLORS };
