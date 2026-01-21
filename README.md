# klazy

[![npm version](https://img.shields.io/npm/v/klazy)](https://www.npmjs.com/package/klazy)
[![npm downloads](https://img.shields.io/npm/dm/klazy)](https://www.npmjs.com/package/klazy)
[![license](https://img.shields.io/npm/l/klazy)](https://github.com/disco-trooper/klazy/blob/master/LICENSE)

Fuzzy kubectl wrapper. No dependencies.

![klazy demo](https://raw.githubusercontent.com/disco-trooper/klazy/master/assets/demo.gif)

```bash
npm install -g klazy
```

Use as `kl` or `klazy`.

## Commands

| Command             | Description              |
| ------------------- | ------------------------ |
| `klazy c`           | Select context           |
| `klazy c -`         | Previous context         |
| `klazy cs`          | Current context          |
| `klazy ns`          | Select namespace         |
| `klazy ns <name>`   | Switch namespace         |
| `klazy ns -`        | Previous namespace       |
| `klazy get`         | List resources           |
| `klazy get deploy`  | List deployments         |
| `klazy get svc -a`  | Services, all namespaces |
| `klazy get pvc`     | Persistent volume claims |
| `klazy get ns`      | List namespaces          |
| `klazy get nodes`   | List nodes               |
| `klazy exec`        | Exec into pod            |
| `klazy exec <name>` | Exec (fuzzy match)       |
| `klazy exec -p`     | Exec with context picker |
| `klazy desc`        | Describe pod             |
| `klazy desc -p`     | Describe with picker     |
| `klazy logs`        | Stream logs              |
| `klazy logs -p`     | Logs with context picker |
| `klazy logs --pipe` | Pipe logs through tool   |
| `klazy logss`       | Stream service logs      |
| `klazy logss -p`    | Service logs with picker |
| `klazy env`         | Pod environment          |
| `klazy env -p`      | Env with context picker  |
| `klazy get -p`      | List with context picker |
| `klazy events`      | Recent events            |
| `klazy restart`     | Restart pod              |
| `klazy copy`        | Copy files               |
| `klazy del`         | Delete pod               |
| `klazy top`         | Metrics                  |
| `klazy pf`          | Port forward (pod)       |
| `klazy pf -p`       | Port forward with picker |
| `klazy pfs`         | Port forward (service)   |
| `klazy pfs -p`      | Service forward w/picker |
| `klazy r`           | Repeat last              |
| `klazy h`           | Help                     |

## Features

- **Fuzzy search** — `klazy exec api` matches `api-server-abc123`
- **Colored status** — Running (green), Pending (yellow), Error (red)
- **Quick switch** — `-` returns to previous context or namespace
- **All namespaces** — `-a` searches everywhere
- **Context picker** — `-p` selects context → namespace → resource
- **Pipe support** — `--pipe tspin` pipes logs through external tools
- **Zsh completion** — `eval "$(klazy completion zsh)"`

## Examples

```bash
# Quick workflow in current namespace
klazy exec api
klazy logs nginx
klazy env worker

# Cross-cluster with picker (-p)
klazy exec -p      # context → namespace → pod → shell
klazy logs -p      # context → namespace → pod → logs
klazy pf -p        # context → namespace → pod → ports

# Pipe logs through external tools
klazy logs nginx --pipe tspin   # colorized logs with tailspin
klazy logs api --pipe "jq ."    # parse JSON logs

# Switch context and namespace
klazy c prod && klazy ns default
klazy c -          # previous context
klazy ns -         # previous namespace

# Copy files
klazy copy nginx:/var/log/app.log ./
```

## Credits

Fork of [laku](https://github.com/prunevac/laku).
