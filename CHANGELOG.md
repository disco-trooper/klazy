# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-20

Initial release. Fork of [laku](https://github.com/prunevac/laku) with improvements.

### Highlights
- Use as `kl` or `klazy`
- Zero runtime dependencies
- Fuzzy search for pods and services
- TypeScript rewrite with full type safety

### New Commands
- `get pvc` - List persistent volume claims
- `get ns` - List namespaces
- `get nodes` - List nodes

### Improvements over laku
- Secure file permissions (0600) for config
- Path validation in `copy` command
- Proper JSON parsing for service selectors
- Consistent error handling
