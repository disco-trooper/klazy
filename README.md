# klazy

> kubectl + lazy = klazy

Lazy kubectl wrapper with fuzzy search and zero dependencies.

## Install

```bash
npm install -g klazy
```

## Commands

| Command | Description |
|---------|-------------|
| `klazy c` | Select context interactively |
| `klazy c -` | Switch to previous context |
| `klazy cs` | Show current context |
| `klazy ns` | Select namespace interactively |
| `klazy ns <name>` | Switch to namespace directly |
| `klazy ns -` | Switch to previous namespace |
| `klazy get` | List resources interactively |
| `klazy get deploy` | List deployments |
| `klazy get svc -a` | List services, all namespaces |
| `klazy exec` | Exec into pod interactively |
| `klazy exec <name>` | Exec into pod (fuzzy match) |
| `klazy desc` | Describe pod interactively |
| `klazy logs` | Stream pod logs |
| `klazy logss` | Stream service pod logs |
| `klazy env` | Show pod environment variables |
| `klazy events` | Show recent events |
| `klazy restart` | Restart pod (delete + recreate) |
| `klazy copy` | Copy files to/from pod |
| `klazy del` | Delete pod with confirmation |
| `klazy top` | Show pod/node metrics |
| `klazy pf` | Port forward to pod |
| `klazy pfs` | Port forward to service |
| `klazy r` | Repeat last command |
| `klazy h` | Show help |

## Features

- **Fuzzy search** - Find pods by partial name
- **Colored output** - Status colors (Running=green, Error=red)
- **Quick switching** - Use `-` for previous context/namespace
- **All namespaces** - Use `-a` flag to search across all
- **Zero dependencies** - Pure Node.js, no external packages
- **Shell completion** - Zsh support

## Shell Completion

```bash
# Add to ~/.zshrc
eval "$(klazy completion zsh)"
```

## Examples

```bash
# Switch context, then namespace
klazy c prod
klazy ns default

# Find and exec into a pod
klazy exec api        # fuzzy matches "api-server-abc123"

# Check pod environment
klazy env nginx

# Quick restart a pod
klazy restart worker

# Copy logs from pod
klazy copy nginx:/var/log/app.log ./app.log
```

## Credits

Fork of [laku](https://github.com/prunevac/laku) by prunevac.
