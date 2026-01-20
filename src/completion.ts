// lib/completion.ts

function generateZshCompletion(): string {
  return `#compdef klazy
_klazy() {
  local -a commands
  commands=(
    'c:Select context' 'cs:Show context' 'ns:Select namespace'
    'get:List resources' 'exec:Exec into pod' 'desc:Describe pod'
    'del:Delete pod' 'logs:Stream logs' 'logss:Service logs'
    'pf:Port forward pod' 'pfs:Port forward svc'
    'top:Show metrics' 'env:Show env' 'events:Show events'
    'restart:Restart pod' 'copy:Copy files' 'r:Repeat' 'h:Help'
  )
  _arguments '1: :->command' '*: :->args'
  case $state in
    command) _describe 'command' commands ;;
  esac
}
_klazy "$@"
`;
}

function outputCompletion(shell: string): void {
  if (shell === 'zsh') {
    console.log(generateZshCompletion());
  } else {
    console.log('Usage: eval "$(klazy completion zsh)"');
    console.log('Supported: zsh');
  }
}

export { outputCompletion };
