# Code Review Fixes v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all issues from code review - critical bugs, dead code, security, and quality improvements

**Architecture:** Fix critical bugs first (cli.ts navigation), then dead code, then security/quality, finally refactoring

**Tech Stack:** TypeScript 5.x, Node.js child_process

---

## Task 1: Fix findIndex -1 in cli.ts up() and down()

**Files:**
- Modify: `src/cli.ts`

**Step 1: Fix up() navigation (lines 174-178)**

Change:
```typescript
// simple shift by one up
visibleOptionsIndices.pop();
const boundaryIndex: number = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[0]);
visibleOptionsIndices.unshift(autocompleteCompliantIndices[boundaryIndex - 1]);
currentPointer = visibleOptionsIndices[0];
```

To:
```typescript
// simple shift by one up
visibleOptionsIndices.pop();
const boundaryIndex: number = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[0]);
if (boundaryIndex === -1 || boundaryIndex === 0) {
    // Edge case: boundary not found or at start, wrap to end
    visibleOptionsIndices.unshift(autocompleteCompliantIndices[autocompleteCompliantIndices.length - 1]);
} else {
    visibleOptionsIndices.unshift(autocompleteCompliantIndices[boundaryIndex - 1]);
}
currentPointer = visibleOptionsIndices[0];
```

**Step 2: Fix down() navigation (lines 228-232)**

Change:
```typescript
// simple shift by one down
visibleOptionsIndices.shift();
const boundaryIndex: number = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[visibleOptionsIndices.length - 1]);
visibleOptionsIndices.push(autocompleteCompliantIndices[boundaryIndex + 1]);
currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
```

To:
```typescript
// simple shift by one down
visibleOptionsIndices.shift();
const boundaryIndex: number = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[visibleOptionsIndices.length - 1]);
if (boundaryIndex === -1 || boundaryIndex >= autocompleteCompliantIndices.length - 1) {
    // Edge case: boundary not found or at end, wrap to start
    visibleOptionsIndices.push(autocompleteCompliantIndices[0]);
} else {
    visibleOptionsIndices.push(autocompleteCompliantIndices[boundaryIndex + 1]);
}
currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
```

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/cli.ts
git commit -m "fix(critical): handle findIndex -1 in up/down navigation"
```

---

## Task 2: Fix currentPointer Before Length Check (cli.ts:86)

**Files:**
- Modify: `src/cli.ts`

**Step 1: Fix doAutoComplete() function**

Change lines 84-94:
```typescript
const autocompleteCompliantIndices: number[] = getAutocompleteCompliantIndices();
visibleOptionsIndices = autocompleteCompliantIndices.slice(0, CHOICES_ON_SCREEN);
currentPointer = visibleOptionsIndices[0];

if (visibleOptionsIndices.length) {
    invalidSelection = false;
} else {
    currentPointer = -1;
    invalidSelection = true;
}
```

To:
```typescript
const autocompleteCompliantIndices: number[] = getAutocompleteCompliantIndices();
visibleOptionsIndices = autocompleteCompliantIndices.slice(0, CHOICES_ON_SCREEN);

if (visibleOptionsIndices.length) {
    currentPointer = visibleOptionsIndices[0];
    invalidSelection = false;
} else {
    currentPointer = -1;
    invalidSelection = true;
}
```

**Step 2: Commit**

```bash
git add src/cli.ts
git commit -m "fix: check array length before accessing element in doAutoComplete"
```

---

## Task 3: Fix DELETE Key Handler (cli.ts:119-127)

**Files:**
- Modify: `src/cli.ts`

**Step 1: Fix DELETE case - remove cursor decrement**

Change lines 119-128:
```typescript
case DELETE:
    if (autoCompleteStringPointer !== autocompleteString.length) {
        autocompleteString = autocompleteString.substring(0, autoCompleteStringPointer) + autocompleteString.substring(autoCompleteStringPointer + 1);
        autoCompleteStringPointer--;
        if (autoCompleteStringPointer < 0) {
            autoCompleteStringPointer = 0;
        }
        doAutoComplete();
    }
    break;
```

To:
```typescript
case DELETE:
    // DELETE removes character at cursor position, cursor stays in place
    if (autoCompleteStringPointer !== autocompleteString.length) {
        autocompleteString = autocompleteString.substring(0, autoCompleteStringPointer) + autocompleteString.substring(autoCompleteStringPointer + 1);
        doAutoComplete();
    }
    break;
```

**Step 2: Commit**

```bash
git add src/cli.ts
git commit -m "fix: DELETE key should not decrement cursor position"
```

---

## Task 4: Remove Dead Code

**Files:**
- Modify: `src/repeat-command.ts`
- Modify: `src/custom.ts`

**Step 1: Remove showLastCommand from repeat-command.ts**

Delete lines 57-65:
```typescript
export const showLastCommand = (): void => {
    const config = configuration.get();
    const command = config?.[lastCommandKey];
    if (!command) {
        console.log('no last command stored');
        return;
    }
    console.log(`Last command: ${command}`);
};
```

**Step 2: Remove unused allNamespaces parameter from custom.ts**

Change line 49:
```typescript
export const runCustomCommand = async (commandName: string, allNamespaces: boolean = false): Promise<void> => {
```

To:
```typescript
export const runCustomCommand = async (commandName: string): Promise<void> => {
```

**Step 3: Commit**

```bash
git add src/repeat-command.ts src/custom.ts
git commit -m "refactor: remove dead code (showLastCommand, unused allNamespaces param)"
```

---

## Task 5: Fix copy.ts split(':') and Direction Bounds

**Files:**
- Modify: `src/copy.ts`

**Step 1: Add bounds check for direction (after line 30)**

Change:
```typescript
const direction = directions.indexOf(directionSel);
```

To:
```typescript
const direction = directions.indexOf(directionSel);
if (direction === -1) return;
```

**Step 2: Fix split(':') to preserve path with colons (lines 48, 63)**

Change line 48:
```typescript
const [podPart, pathPart] = src.split(':');
```

To:
```typescript
const colonIdx = src.indexOf(':');
const podPart = src.substring(0, colonIdx);
const pathPart = src.substring(colonIdx + 1);
```

Change line 63:
```typescript
const [podPart, pathPart] = dest.split(':');
```

To:
```typescript
const colonIdx = dest.indexOf(':');
const podPart = dest.substring(0, colonIdx);
const pathPart = dest.substring(colonIdx + 1);
```

**Step 3: Commit**

```bash
git add src/copy.ts
git commit -m "fix: handle paths with colons and add direction bounds check"
```

---

## Task 6: Add Path Validation in copy.ts

**Files:**
- Modify: `src/copy.ts`

**Step 1: Add path validation helper at top of file**

After imports, add:
```typescript
import * as path from 'node:path';

/**
 * Validates local path doesn't escape current directory via traversal
 */
function isPathSafe(localPath: string): boolean {
  const resolved = path.resolve(localPath);
  const cwd = process.cwd();
  // Allow paths within cwd or absolute paths (user's explicit choice)
  return resolved.startsWith(cwd) || path.isAbsolute(localPath);
}
```

**Step 2: Add validation before kubectl cp (lines 35-39)**

Change:
```typescript
if (direction === 0) {
  spawnSync('kubectl', ['cp', `${ns}/${selectedPod.name}:${remotePath}`, localPath], { stdio: 'inherit' });
} else {
  spawnSync('kubectl', ['cp', localPath, `${ns}/${selectedPod.name}:${remotePath}`], { stdio: 'inherit' });
}
```

To:
```typescript
if (!isPathSafe(localPath)) {
  console.log(colorize('Warning: Path traversal detected. Use absolute path or path within current directory.', 'yellow'));
  return;
}

if (direction === 0) {
  spawnSync('kubectl', ['cp', `${ns}/${selectedPod.name}:${remotePath}`, localPath], { stdio: 'inherit' });
} else {
  spawnSync('kubectl', ['cp', localPath, `${ns}/${selectedPod.name}:${remotePath}`], { stdio: 'inherit' });
}
```

**Step 3: Commit**

```bash
git add src/copy.ts
git commit -m "fix(security): add path traversal validation in copy"
```

---

## Task 7: Add Config Validation and File Permissions

**Files:**
- Modify: `src/config.ts`

**Step 1: Add type guard for config validation**

After imports, add:
```typescript
function isValidKlazyConfig(obj: unknown): obj is KlazyConfig {
  if (!obj || typeof obj !== 'object') return false;
  const config = obj as Record<string, unknown>;
  // All fields are optional, just validate types if present
  if (config.previousNamespace !== undefined && typeof config.previousNamespace !== 'string') return false;
  if (config.previousContext !== undefined && typeof config.previousContext !== 'string') return false;
  if (config.lastCommand !== undefined && typeof config.lastCommand !== 'string') return false;
  // custom array validation delegated to isValidCustomCommand
  return true;
}
```

**Step 2: Update getConfig() to use validation (line 30)**

Change:
```typescript
return JSON.parse(rawContent) as KlazyConfig;
```

To:
```typescript
const parsed = JSON.parse(rawContent);
if (!isValidKlazyConfig(parsed)) {
  logError('validate config', 'invalid config structure');
  return { ...defaultConfig };
}
return parsed;
```

**Step 3: Update writeConfig() to set file permissions (line 39)**

Change:
```typescript
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
```

To:
```typescript
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
```

**Step 4: Commit**

```bash
git add src/config.ts
git commit -m "fix(security): add config validation and secure file permissions"
```

---

## Task 8: Add Error Logging in logs.ts

**Files:**
- Modify: `src/logs.ts`

**Step 1: Fix empty catch block (lines 29-31)**

Change:
```typescript
} catch {
    return [];
}
```

To:
```typescript
} catch (err) {
    console.error('Failed to parse service selector:', err instanceof Error ? err.message : 'unknown error');
    return [];
}
```

**Step 2: Commit**

```bash
git add src/logs.ts
git commit -m "fix: add error logging in getServicePods catch block"
```

---

## Task 9: Extract selectService() Utility

**Files:**
- Modify: `src/misc.ts`
- Modify: `src/logs.ts`
- Modify: `src/port-forward.ts`

**Step 1: Add selectService to misc.ts**

Add imports:
```typescript
import type { Context, Pod, Service } from './types';
```

Add function after selectPod:
```typescript
/**
 * Interactive service selection with optional fuzzy search
 */
export async function selectService(
  services: Service[],
  searchTerm: string | undefined,
  allNamespaces: boolean,
  question: string = 'Select service:'
): Promise<Service | undefined> {
  if (services.length === 0) {
    console.log('No services found');
    return undefined;
  }

  const serviceNames = services.map(s => allNamespaces ? `${s.namespace}/${s.name}` : s.name);

  if (searchTerm) {
    const filtered = fuzzyFilter(serviceNames, searchTerm);
    if (filtered.length === 0) {
      console.log(`No services matching "${searchTerm}"`);
      return undefined;
    }
    if (filtered.length === 1) {
      return services[filtered[0].originalIndex];
    }
    const displayNames = filtered.map(f => serviceNames[f.originalIndex]);
    const selected = await select({ question, options: displayNames, autocomplete: true });
    if (!selected) return undefined;
    const idx = displayNames.indexOf(selected);
    if (idx === -1) return undefined;
    return services[filtered[idx].originalIndex];
  }

  const selected = await select({ question, options: serviceNames, autocomplete: true });
  if (!selected) return undefined;
  const idx = serviceNames.indexOf(selected);
  if (idx === -1) return undefined;
  return services[idx];
}
```

**Step 2: Update logs.ts to use selectService**

Add import:
```typescript
import { selectService, selectPod } from './misc';
```

Replace service selection block (lines 46-71) with:
```typescript
const selectedService = await selectService(services, searchTerm, allNamespaces);
if (!selectedService) return;
```

Replace pod selection block (lines 95-120) with:
```typescript
const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod:');
if (!selectedPod) return;
```

Update variable usage:
```typescript
podName = selectedPod.name;
namespace = selectedPod.namespace || getCurrentNamespace();
```

**Step 3: Update port-forward.ts to use selectService**

Add import:
```typescript
import { selectPort, validatePort, selectService, selectPod } from './misc';
```

Remove fuzzyFilter import (no longer needed).

Replace service selection block (lines 31-44) with:
```typescript
if (resourceType === 'service') {
    const services = getServices(allNamespaces);
    const selectedService = await selectService(services, undefined, allNamespaces);
    if (!selectedService) return;
    resourceName = selectedService.name;
    namespace = selectedService.namespace || getCurrentNamespace();
} else {
```

Replace pod selection block (lines 45-59) with:
```typescript
} else {
    const pods = getPods(allNamespaces);
    const selectedPod = await selectPod(pods, undefined, allNamespaces, 'Select pod:');
    if (!selectedPod) return;
    resourceName = selectedPod.name;
    namespace = selectedPod.namespace || getCurrentNamespace();
}
```

**Step 4: Build and verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/misc.ts src/logs.ts src/port-forward.ts
git commit -m "refactor: extract selectService utility, simplify logs and port-forward"
```

---

## Task 10: Refactor copy.ts to Use selectPod

**Files:**
- Modify: `src/copy.ts`

**Step 1: Update imports**

Change:
```typescript
import { getPods } from './exec';
```

To:
```typescript
import { getPods } from './exec';
import { selectPod } from './misc';
```

**Step 2: Replace inline pod selection (lines 18-24)**

Change:
```typescript
const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
if (!selected) return;
const idx = displayNames.indexOf(selected);
if (idx === -1) return;
const selectedPod = pods[idx];
```

To:
```typescript
const selectedPod = await selectPod(pods, undefined, allNamespaces, 'Select pod:');
if (!selectedPod) return;
```

**Step 3: Commit**

```bash
git add src/copy.ts
git commit -m "refactor: use selectPod utility in copy.ts for consistency"
```

---

## Task 11: Update ResourceType Union

**Files:**
- Modify: `src/types.ts`

**Step 1: Expand ResourceType to match actual usage**

Change line 13:
```typescript
export type ResourceType = 'pod' | 'service';
```

To:
```typescript
export type ResourceType = 'pod' | 'service';

// Extended type for get-resources command
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

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add GetResourceType union for type-safe resource arguments"
```

---

## Task 12: Final Build and Verification

**Step 1: Clean rebuild**

```bash
npm run build
```

**Step 2: Test all affected commands**

```bash
npm link
klazy h
klazy cs
klazy logs
klazy pf
klazy pfs
klazy cp
```

**Step 3: Final commit**

```bash
git add -u
git commit -m "chore: complete code review fixes v2"
```

---

## Summary

| Task | Priority | Files | Description |
|------|----------|-------|-------------|
| 1 | Must Fix | cli.ts | findIndex -1 in up/down |
| 2 | Must Fix | cli.ts | currentPointer before length check |
| 3 | Must Fix | cli.ts | DELETE key handler |
| 4 | Must Fix | repeat-command.ts, custom.ts | Remove dead code |
| 5 | Better | copy.ts | split(':') and direction bounds |
| 6 | Better | copy.ts | Path traversal validation |
| 7 | Better | config.ts | Config validation + permissions |
| 8 | Better | logs.ts | Error logging in catch |
| 9 | Consider | misc.ts, logs.ts, port-forward.ts | Extract selectService |
| 10 | Consider | copy.ts | Use selectPod |
| 11 | Consider | types.ts | Expand ResourceType |
| 12 | - | - | Final verification |

---

## Parallelization Groups

**Must Fix (parallel):**
- Task 1, 2, 3, 4

**Better (parallel after Must Fix):**
- Task 5, 6, 7, 8

**Consider (parallel after Better):**
- Task 9, 10, 11

**Final:**
- Task 12
