# Plan: Code Review Fixes v3

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix security vulnerability (path traversal), type consistency, and code quality issues from code review v3.

**Architecture:** Direct fixes to copy.ts, config.ts, types.ts, get-resources.ts, logs.ts

**Tech Stack:** TypeScript, Node.js path module

---

## Task 1: Fix isPathSafe logic flaw (CRITICAL)

**Files:**
- Modify: `src/copy.ts:15-19`

**Step 1: Fix the OR condition**

Current broken code:
```typescript
function isPathSafe(localPath: string): boolean {
  const resolved = path.resolve(localPath);
  const cwd = process.cwd();
  return resolved.startsWith(cwd) || path.isAbsolute(localPath);
}
```

Replace with:
```typescript
/**
 * Validates local path is within cwd or is an explicit absolute path
 * that doesn't target sensitive system directories
 */
function isPathSafe(localPath: string): boolean {
  const resolved = path.resolve(localPath);
  const cwd = process.cwd();

  // Allow paths within current working directory
  if (resolved.startsWith(cwd + path.sep) || resolved === cwd) {
    return true;
  }

  // Allow absolute paths but block sensitive directories
  if (path.isAbsolute(localPath)) {
    const sensitiveRoots = ['/etc', '/var', '/usr', '/bin', '/sbin', '/root', '/sys', '/proc'];
    const blocked = sensitiveRoots.some(root => resolved.startsWith(root));
    return !blocked;
  }

  return false;
}
```

**Step 2: Commit**

```bash
git add src/copy.ts
git commit -m "fix(security): improve isPathSafe to block sensitive directories"
```

---

## Task 2: Add path validation to CLI mode (CRITICAL)

**Files:**
- Modify: `src/copy.ts:60-96`

**Step 1: Add validation before first spawnSync (pod to local)**

After line 73 (`const ns = ...`), before line 75 (`spawnSync`), add:

```typescript
    // Validate destination path
    if (!isPathSafe(dest)) {
      console.log(colorize('Error: Destination path outside allowed directories', 'red'));
      return;
    }
```

**Step 2: Add validation before second spawnSync (local to pod)**

After line 90 (`const ns = ...`), before line 92 (`spawnSync`), add:

```typescript
    // Validate source path
    if (!isPathSafe(src)) {
      console.log(colorize('Error: Source path outside allowed directories', 'red'));
      return;
    }
```

**Step 3: Commit**

```bash
git add src/copy.ts
git commit -m "fix(security): add path validation to CLI mode copy operations"
```

---

## Task 3: Unify config error returns

**Files:**
- Modify: `src/config.ts:37-40,48-51`

**Step 1: Fix first catch block (line 39)**

Change:
```typescript
    } catch {
        logError('read config file', configPath);
        return {};
    }
```

To:
```typescript
    } catch {
        logError('read config file', configPath);
        return { ...defaultConfig };
    }
```

**Step 2: Fix second catch block (line 50)**

Change:
```typescript
    } catch {
        logError('parse config file', configPath);
        return {};
    }
```

To:
```typescript
    } catch {
        logError('parse config file', configPath);
        return { ...defaultConfig };
    }
```

**Step 3: Commit**

```bash
git add src/config.ts
git commit -m "fix: return defaultConfig consistently on all error paths"
```

---

## Task 4: Extend GetResourceType to match RESOURCE_ALIASES

**Files:**
- Modify: `src/types.ts:16-24`

**Step 1: Add missing resource types**

Change:
```typescript
export type GetResourceType =
  | 'pods' | 'po' | 'pod'
  | 'services' | 'svc' | 'service'
  | 'deployments' | 'deploy' | 'deployment'
  | 'statefulsets' | 'sts' | 'statefulset'
  | 'daemonsets' | 'ds' | 'daemonset'
  | 'configmaps' | 'cm' | 'configmap'
  | 'secrets' | 'secret'
  | 'ingresses' | 'ing' | 'ingress';
```

To:
```typescript
export type GetResourceType =
  | 'pods' | 'po' | 'pod'
  | 'services' | 'svc' | 'service'
  | 'deployments' | 'deploy' | 'deployment'
  | 'statefulsets' | 'sts' | 'statefulset'
  | 'daemonsets' | 'ds' | 'daemonset'
  | 'configmaps' | 'cm' | 'configmap'
  | 'secrets' | 'secret'
  | 'ingresses' | 'ing' | 'ingress'
  | 'persistentvolumeclaims' | 'pvc'
  | 'namespaces' | 'ns'
  | 'nodes' | 'node';
```

**Step 2: Add to RESOURCE_OPTIONS in get-resources.ts**

In `src/get-resources.ts:22`, change:
```typescript
const RESOURCE_OPTIONS: string[] = ['pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'configmaps', 'secrets', 'ingresses'];
```

To:
```typescript
const RESOURCE_OPTIONS: string[] = ['pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'configmaps', 'secrets', 'ingresses', 'persistentvolumeclaims', 'namespaces', 'nodes'];
```

**Step 3: Commit**

```bash
git add src/types.ts src/get-resources.ts
git commit -m "feat: extend GetResourceType to include pvc, ns, nodes"
```

---

## Task 5: Fix JSON quote replacement in logs.ts

**Files:**
- Modify: `src/logs.ts:10-32`

**Step 1: Replace quote replacement with proper JSON output**

Change getServicePods function to use kubectl's native JSON output:

```typescript
function getServicePods(serviceName: string, namespace: string): string[] {
  // Get selector as JSON directly
  const selectorResult = spawnSync('kubectl', [
    'get', 'service', serviceName, '-n', namespace,
    '-o', 'json'
  ], { encoding: 'utf8' });

  if (selectorResult.status !== 0) return [];

  try {
    const service = JSON.parse(selectorResult.stdout) as { spec?: { selector?: Record<string, string> } };
    const selector = service.spec?.selector;
    if (!selector || Object.keys(selector).length === 0) return [];

    const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');

    const podsResult = spawnSync('kubectl', [
      'get', 'pods', '-n', namespace, '-l', labelSelector,
      '-o', 'jsonpath={.items[*].metadata.name}'
    ], { encoding: 'utf8' });

    if (podsResult.status !== 0) return [];
    return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
  } catch (err) {
    console.error('Failed to parse service selector:', err instanceof Error ? err.message : 'unknown error');
    return [];
  }
}
```

**Step 2: Commit**

```bash
git add src/logs.ts
git commit -m "fix: use proper JSON output instead of quote replacement for service selector"
```

---

## Task 6: Add error details to catch blocks

**Files:**
- Modify: `src/config.ts:35-51,54-59`

**Step 1: Add error parameter to catch blocks**

Change first catch (lines 37-40):
```typescript
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        logError('read config file', `${configPath}: ${msg}`);
        return { ...defaultConfig };
    }
```

Change second catch (lines 48-51):
```typescript
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        logError('parse config file', `${configPath}: ${msg}`);
        return { ...defaultConfig };
    }
```

Change third catch (lines 57-59):
```typescript
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        logError('write config file', `${configPath}: ${msg}`);
    }
```

**Step 2: Commit**

```bash
git add src/config.ts
git commit -m "fix: include error details in config error logging"
```

---

## Task 7: Build and verify

**Step 1: Build TypeScript**

```bash
npm run build
```

**Step 2: Test CLI**

```bash
# Test help
./lib/index.js h

# Test get resources with new types
./lib/index.js get pvc
./lib/index.js get ns
./lib/index.js get nodes
```

**Step 3: Verify path validation (manual test)**

```bash
# This should be blocked:
./lib/index.js copy testpod:/tmp/test /etc/test
# Expected: "Error: Destination path outside allowed directories"

# This should work:
./lib/index.js copy testpod:/tmp/test ./local-file
```

**Step 4: Commit build output**

```bash
git add -u
git commit -m "chore: rebuild after code review fixes v3"
```

---

## Summary

| Task | Priority | Files | Description |
|------|----------|-------|-------------|
| 1 | Critical | copy.ts | Fix isPathSafe OR logic |
| 2 | Critical | copy.ts | Add path validation to CLI mode |
| 3 | Better | config.ts | Unify error returns |
| 4 | Better | types.ts, get-resources.ts | Extend GetResourceType |
| 5 | Consider | logs.ts | Fix JSON quote replacement |
| 6 | Consider | config.ts | Add error details to logging |
| 7 | - | - | Build and verify |

---

## Verification

```bash
# Build
npm run build

# Test path validation
node -e "
const path = require('path');
function isPathSafe(localPath) {
  const resolved = path.resolve(localPath);
  const cwd = process.cwd();
  if (resolved.startsWith(cwd + path.sep) || resolved === cwd) return true;
  if (path.isAbsolute(localPath)) {
    const sensitiveRoots = ['/etc', '/var', '/usr', '/bin', '/sbin', '/root', '/sys', '/proc'];
    return !sensitiveRoots.some(root => resolved.startsWith(root));
  }
  return false;
}
console.log('Test /etc/passwd:', isPathSafe('/etc/passwd')); // false
console.log('Test ./local:', isPathSafe('./local')); // true
console.log('Test /home/user/file:', isPathSafe('/home/user/file')); // true
console.log('Test ../escape:', isPathSafe('../escape')); // depends on cwd
"
```
