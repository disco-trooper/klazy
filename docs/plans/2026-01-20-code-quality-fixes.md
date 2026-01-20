# Code Quality Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all issues from code review - security vulnerabilities, code duplication, type safety, and quality improvements

**Architecture:** Fix critical issues first, then extract shared utilities, finally refactor for maintainability

**Tech Stack:** TypeScript 5.x, Node.js child_process

---

## Task 1: Fix Command Injection in metrics.ts

**Files:**
- Modify: `src/metrics.ts`

**Step 1: Replace execSync with spawnSync**

```typescript
// src/metrics.ts
import { spawnSync } from 'node:child_process';
import { colorize } from './colors';

export async function showMetrics(resourceType: string = 'pods', allNamespaces: boolean = false): Promise<void> {
  const type = resourceType === 'nodes' ? 'nodes' : 'pods';
  const args = ['top', type];
  if (allNamespaces) args.push('--all-namespaces');

  const result = spawnSync('kubectl', args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.log(colorize('Failed to get metrics. Is metrics-server running?', 'yellow'));
    console.log('Install: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml');
  }
}
```

**Step 2: Build and verify**

```bash
npm run build
```
Expected: No errors

**Step 3: Commit**

```bash
git add src/metrics.ts
git commit -m "fix(security): replace execSync with spawnSync in metrics.ts"
```

---

## Task 2: Remove Duplicate getServices()

**Files:**
- Modify: `src/logs.ts` (remove getServices, import from port-forward)
- Modify: `src/port-forward.ts` (export getServices)

**Step 1: Export getServices from port-forward.ts**

In `src/port-forward.ts`, change:
```typescript
function getServices(allNamespaces: boolean = false): Service[] {
```
to:
```typescript
export function getServices(allNamespaces: boolean = false): Service[] {
```

**Step 2: Remove getServices from logs.ts and import**

In `src/logs.ts`:
1. Remove lines 33-44 (getServices function)
2. Add to imports:
```typescript
import { getServices } from './port-forward';
```

**Step 3: Build and verify**

```bash
npm run build
```
Expected: No errors

**Step 4: Commit**

```bash
git add src/logs.ts src/port-forward.ts
git commit -m "refactor: remove duplicate getServices, export from port-forward"
```

---

## Task 3: Fix Duplicate CustomCommand Interface in help.ts

**Files:**
- Modify: `src/help.ts`

**Step 1: Remove local interface and use import**

In `src/help.ts`:
1. Remove lines 4-7 (local CustomCommand interface)
2. Add to imports:
```typescript
import type { CustomCommand } from './types';
```

**Step 2: Build and verify**

```bash
npm run build
```
Expected: No errors

**Step 3: Commit**

```bash
git add src/help.ts
git commit -m "fix: use CustomCommand from types.ts instead of local duplicate"
```

---

## Task 4: Extract selectPod() Utility

**Files:**
- Modify: `src/misc.ts` (add selectPod function)
- Modify: `src/delete.ts`, `src/describe.ts`, `src/env.ts`, `src/exec.ts`, `src/restart.ts`

**Step 1: Add selectPod to misc.ts**

Add imports and function to `src/misc.ts`:

```typescript
import { fuzzyFilter } from './fuzzy';
import type { Context, Pod } from './types';

/**
 * Interactive pod selection with optional fuzzy search
 * Returns undefined if no pods found or selection cancelled
 */
export async function selectPod(
  pods: Pod[],
  searchTerm: string | undefined,
  allNamespaces: boolean,
  question: string = 'Select pod:'
): Promise<Pod | undefined> {
  if (pods.length === 0) {
    console.log('No pods found');
    return undefined;
  }

  const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);

  if (searchTerm) {
    const filtered = fuzzyFilter(podNames, searchTerm);
    if (filtered.length === 0) {
      console.log(`No pods matching "${searchTerm}"`);
      return undefined;
    }
    if (filtered.length === 1) {
      return pods[filtered[0].originalIndex];
    }
    const displayNames = filtered.map(f => podNames[f.originalIndex]);
    const selected = await select({ question, options: displayNames, autocomplete: true });
    if (!selected) return undefined;
    const idx = displayNames.indexOf(selected);
    if (idx === -1) return undefined;
    return pods[filtered[idx].originalIndex];
  }

  const selected = await select({ question, options: podNames, autocomplete: true });
  if (!selected) return undefined;
  const idx = podNames.indexOf(selected);
  if (idx === -1) return undefined;
  return pods[idx];
}
```

**Step 2: Refactor delete.ts**

Replace pod selection block (lines 18-42) with:
```typescript
import { selectPod } from './misc';

// In deletePod function, replace selection logic with:
const selectedPod = await selectPod(pods, searchTerm, allNamespaces, 'Select pod to delete:');
if (!selectedPod) return;
```

**Step 3: Refactor describe.ts, env.ts, exec.ts, restart.ts**

Same pattern for each file - import selectPod and replace selection block.

**Step 4: Build and verify**

```bash
npm run build
klazy del
klazy exec
```

**Step 5: Commit**

```bash
git add src/misc.ts src/delete.ts src/describe.ts src/env.ts src/exec.ts src/restart.ts
git commit -m "refactor: extract selectPod utility, fix indexOf bounds check"
```

---

## Task 5: Add indexOf Bounds Check (remaining files)

**Files:**
- Modify: `src/logs.ts` (service selection)
- Modify: `src/port-forward.ts` (service selection)
- Modify: `src/copy.ts` (pod selection)

**Step 1: Fix all indexOf usages**

Pattern for each file - add bounds check after indexOf:
```typescript
const idx = displayNames.indexOf(selected);
if (idx === -1) return;  // Add this line
```

Apply to:
- `src/logs.ts` lines ~70-80 (service selection)
- `src/port-forward.ts` lines ~40-55 (service and pod selection)
- `src/copy.ts` lines ~22-23 (pod selection)

**Step 2: Build and verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/logs.ts src/port-forward.ts src/copy.ts
git commit -m "fix: add indexOf bounds check in service/pod selection"
```

---

## Task 6: Fix Unsafe Type Assertions in misc.ts

**Files:**
- Modify: `src/misc.ts`

**Step 1: Fix selectNamespace (line 46)**

Change:
```typescript
const namespaces = nsSplit.map(s => s.trim().split(/\s/).shift() as string);
```
to:
```typescript
const namespaces = nsSplit
  .map(s => s.trim().split(/\s/)[0])
  .filter((name): name is string => Boolean(name));
```

**Step 2: Fix selectResource (line 61)**

Same pattern:
```typescript
const resources = resourceSplit
  .map(s => s.trim().split(/\s/)[0])
  .filter((name): name is string => Boolean(name));
```

**Step 3: Commit**

```bash
git add src/misc.ts
git commit -m "fix: replace unsafe type assertions with proper type guards"
```

---

## Task 7: Extract Magic Numbers to Constants

**Files:**
- Modify: `src/events.ts`
- Modify: `src/help.ts`
- Modify: `src/misc.ts`

**Step 1: Fix events.ts**

Add constants at top of file:
```typescript
const DEFAULT_EVENT_LIMIT = 20;
const MAX_MESSAGE_LENGTH = 60;
const TRUNCATE_LENGTH = 57;
```

**Step 2: Fix help.ts**

```typescript
const HELP_PAD_WIDTH = 18;
```

**Step 3: Fix misc.ts**

```typescript
const MAX_PORT = 65535;
```

**Step 4: Commit**

```bash
git add src/events.ts src/help.ts src/misc.ts
git commit -m "refactor: extract magic numbers to named constants"
```

---

## Task 8: Add ResourceType Union

**Files:**
- Modify: `src/types.ts`
- Modify: `src/port-forward.ts`
- Modify: `src/logs.ts`

**Step 1: Add type to types.ts**

```typescript
export type ResourceType = 'pod' | 'service';
```

**Step 2: Update function signatures**

In `port-forward.ts`:
```typescript
export async function portForward(resourceType: ResourceType, ...): Promise<void>
```

In `logs.ts`:
```typescript
export async function streamLogs(resourceType: ResourceType, ...): Promise<void>
```

**Step 3: Commit**

```bash
git add src/types.ts src/port-forward.ts src/logs.ts
git commit -m "feat: add ResourceType union for type-safe resource parameters"
```

---

## Task 9: Standardize Error Messages

**Files:**
- Modify: `src/colors.ts`
- Modify: `src/config.ts`, `src/context.ts`, `src/get-resources.ts`

**Step 1: Add helpers to colors.ts**

```typescript
export function logError(action: string, detail?: string): void {
  const message = detail ? `Failed to ${action}: ${detail}` : `Failed to ${action}`;
  console.log(colorize(message, 'red'));
}

export function logWarning(message: string): void {
  console.log(colorize(message, 'yellow'));
}
```

**Step 2: Update error messages in other files**

Replace inconsistent error logging with `logError()` calls.

**Step 3: Commit**

```bash
git add src/colors.ts src/config.ts src/context.ts src/get-resources.ts
git commit -m "refactor: standardize error messages with logError helper"
```

---

## Task 10: Final Build and Verification

**Step 1: Clean rebuild**

```bash
npm run build
```

**Step 2: Test all commands**

```bash
npm link
klazy h
klazy cs
klazy top
klazy get pods
klazy exec
klazy del
klazy logs
```

**Step 3: Final commit**

```bash
git add -u
git commit -m "chore: complete code quality fixes"
```

---

## Summary

| Task | Priority | Files | Effort |
|------|----------|-------|--------|
| 1. metrics.ts execSync | Must Fix | 1 | Low |
| 2. Duplicate getServices | Must Fix | 2 | Low |
| 3. Duplicate CustomCommand | Must Fix | 1 | Low |
| 4. Extract selectPod | Better | 6 | Medium |
| 5. indexOf bounds check | Better | 3 | Low |
| 6. Type assertions | Better | 1 | Low |
| 7. Magic numbers | Consider | 3 | Low |
| 8. ResourceType union | Consider | 3 | Low |
| 9. Error messages | Consider | 4 | Medium |
| 10. Final verification | - | - | Low |

---

## Parallelization Groups

**Must Fix First (sequential):**
- Task 1, 2, 3

**Parallel Group A (after Must Fix):**
- Task 4, 5

**Parallel Group B:**
- Task 6, 7, 8

**Final:**
- Task 9, 10
