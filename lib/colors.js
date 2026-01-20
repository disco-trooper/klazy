// lib/colors.js
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function colorizeStatus(status) {
  const statusColors = {
    'Running': 'green',
    'Pending': 'yellow',
    'ContainerCreating': 'cyan',
    'Error': 'red',
    'CrashLoopBackOff': 'red',
    'ImagePullBackOff': 'red',
    'Completed': 'gray',
    'Terminated': 'gray',
    'Succeeded': 'green',
    'Failed': 'red',
  };
  const color = statusColors[status] || 'reset';
  return colorize(status, color);
}

module.exports = { colors, colorize, colorizeStatus };
