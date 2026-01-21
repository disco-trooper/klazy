# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-01-21

### Added
- **Pipe support** (`--pipe`) for log processing
  - `logs --pipe tspin` — colorize logs with tailspin
  - `logs --pipe "jq ."` — parse JSON logs
  - Works with `logs` and `logss` commands

## [1.1.0] - 2026-01-21

### Added
- **Context picker** (`-p`/`--pick`) for cross-cluster workflows
  - `exec -p` — select context → namespace → pod → shell
  - `logs -p` — select context → namespace → pod → logs
  - `logss -p` — select context → namespace → service → pod → logs
  - `pf -p` — select context → namespace → pod → port forward
  - `pfs -p` — select context → namespace → service → port forward
  - `desc -p` — select context → namespace → pod → describe
  - `env -p` — select context → namespace → pod → env
  - `get -p` — select context → namespace → list resources

## [1.0.0] - 2026-01-20

Initial release. Fork of [laku](https://github.com/prunevac/laku).

### Highlights
- Use as `kl` or `klazy`
- Zero runtime dependencies
- TypeScript rewrite with full type safety

### New Commands
- `desc` — describe pod with colorized output
- `env` — show pod environment variables
- `events` — show recent cluster events
- `restart` — restart pod (delete and let k8s recreate)
- `copy` — copy files to/from pods
- `del` — delete pod with confirmation
- `top` — show pod/node metrics
- `logss` — logs from service (selects service → pod)
- `get pvc` — persistent volume claims
- `get ns` — namespaces
- `get nodes` — nodes
- `c -` / `ns -` — quick switch to previous context/namespace

### Improvements
- Fuzzy search (laku has substring matching only)
- Secure config permissions (0600)
- Consistent error handling (spawnSync instead of execSync)
