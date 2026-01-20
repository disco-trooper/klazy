# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-20

### Added
- TypeScript rewrite with full type safety
- Extended `get` command support: `pvc`, `ns`, `nodes`
- Fuzzy search for pod/service selection
- `selectPod` and `selectService` utilities for consistent selection
- Config file validation with type guards
- Secure file permissions (0600) for config file

### Fixed
- Path traversal vulnerability in `copy` command (CLI mode validation)
- `isPathSafe` logic to block sensitive directories (`/etc`, `/var`, etc.)
- JSON parsing for service selectors (proper `-o json` instead of quote replacement)
- Consistent error returns in config module
- Error logging with detailed messages

### Changed
- Migrated from JavaScript to TypeScript
- Improved error handling across all modules
- Refactored logs and port-forward to use shared utilities

### Security
- Added path validation for both interactive and CLI copy modes
- Blocked access to sensitive system directories
- Config file created with restricted permissions
