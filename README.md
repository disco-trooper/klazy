# klazy

Fuzzy kubectl wrapper. No dependencies.

```bash
npm install -g klazy
```

## Commands

| Command | Description |
|---------|-------------|
| `klazy c` | Select context |
| `klazy c -` | Previous context |
| `klazy cs` | Current context |
| `klazy ns` | Select namespace |
| `klazy ns <name>` | Switch namespace |
| `klazy ns -` | Previous namespace |
| `klazy get` | List resources |
| `klazy get deploy` | List deployments |
| `klazy get svc -a` | Services, all namespaces |
| `klazy exec` | Exec into pod |
| `klazy exec <name>` | Exec (fuzzy match) |
| `klazy desc` | Describe pod |
| `klazy logs` | Stream logs |
| `klazy logss` | Stream service logs |
| `klazy env` | Pod environment |
| `klazy events` | Recent events |
| `klazy restart` | Restart pod |
| `klazy copy` | Copy files |
| `klazy del` | Delete pod |
| `klazy top` | Metrics |
| `klazy pf` | Port forward (pod) |
| `klazy pfs` | Port forward (service) |
| `klazy r` | Repeat last |
| `klazy h` | Help |

## Features

- **Fuzzy search** — `klazy exec api` matches `api-server-abc123`
- **Colored status** — Running (green), Pending (yellow), Error (red)
- **Quick switch** — `-` returns to previous context or namespace
- **All namespaces** — `-a` searches everywhere
- **Zsh completion** — `eval "$(klazy completion zsh)"`

## Examples

```bash
klazy c prod && klazy ns default
klazy exec api
klazy env nginx
klazy restart worker
klazy copy nginx:/var/log/app.log ./
```

## Credits

Fork of [laku](https://github.com/prunevac/laku).
