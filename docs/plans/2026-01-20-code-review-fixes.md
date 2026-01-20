# Code Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Opravit bezpecnostni a kvalitativni problemy z code review (7 Critical Security, 1 Critical Bug, 6 High, 8 Medium, 5 Low)

**Architecture:** Postupna oprava od nejzavaznejsich problemu (command injection) az po stylove nedostatky. Kazda faze ma vlastni commit.

**Tech Stack:** Node.js, child_process (spawnSync), kubectl CLI

---

## Task 1: Vytvorit helper pro bezpecne spousteni kubectl

**Files:**
- Create: `lib/kubectl.js`

**Step 1: Napsat helper modul**

```javascript
// lib/kubectl.js
const { spawnSync, spawn } = require('child_process');

/**
 * Bezpecne spusti kubectl prikaz s argumenty jako array (zadna shell interpolace)
 * @param {string[]} args - argumenty pro kubectl
 * @param {object} options - options pro spawnSync
 * @returns {{stdout: string, stderr: string, status: number}}
 */
function kubectlSync(args, options = {}) {
  const result = spawnSync('kubectl', args, {
    encoding: 'utf8',
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status
  };
}

/**
 * Spusti kubectl s stdio inherit (pro interaktivni prikazy)
 * @param {string[]} args
 */
function kubectlInherit(args) {
  const result = spawnSync('kubectl', args, { stdio: 'inherit' });
  return result.status;
}

/**
 * Spusti kubectl jako async spawn (pro logs, exec)
 * @param {string[]} args
 * @param {object} options
 * @returns {ChildProcess}
 */
function kubectlSpawn(args, options = {}) {
  return spawn('kubectl', args, options);
}

module.exports = { kubectlSync, kubectlInherit, kubectlSpawn };
```

**Step 2: Commit**

```bash
git add lib/kubectl.js
git commit -m "feat: add kubectl helper for safe command execution"
```

---

## Task 2: Opravit command injection v context.js

**Files:**
- Modify: `lib/context.js`

**Step 1: Nahradit execSync za spawnSync v useContext**

```javascript
// lib/context.js - nahradit radek 1
const { spawnSync } = require('child_process');
```

```javascript
// lib/context.js - nahradit radek 8
let currentContext;
try {
  const result = spawnSync('kubectl', ['config', 'current-context'], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.log('Failed to get current context');
    return;
  }
  currentContext = result.stdout.trim();
} catch (err) {
  console.log('Failed to get current context:', err.message);
  return;
}
```

```javascript
// lib/context.js - nahradit radek 28
const result = spawnSync('kubectl', ['config', 'use-context', newContext], { stdio: 'inherit' });
if (result.status !== 0) {
  console.log('Failed to switch context');
  return;
}
```

**Step 2: Commit**

```bash
git add lib/context.js
git commit -m "fix(security): prevent command injection in context.js"
```

---

## Task 3: Opravit null reference v context.js

**Files:**
- Modify: `lib/context.js`

**Step 1: Pridat null check v showCurrentContext**

```javascript
// lib/context.js - nahradit funkci showCurrentContext
const showCurrentContext = () => {
    const contexts = getContexts();
    const current = contexts.find(c => c.current);
    if (!current) {
        console.log('No context currently selected');
        return;
    }
    console.log(`current context: ${colorize(current.name, 'cyan')}`);
}
```

**Step 2: Commit**

```bash
git add lib/context.js
git commit -m "fix: handle null current context in showCurrentContext"
```

---

## Task 4: Opravit command injection v namespace.js

**Files:**
- Modify: `lib/namespace.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/namespace.js - nahradit radky 1-3
const { spawnSync } = require('child_process');
const { select } = require('./cli');
const { getConfig, writeConfig } = require('./config');
const { colorize } = require('./colors');
```

```javascript
// lib/namespace.js - nahradit funkci getNamespaces
function getNamespaces() {
  const result = spawnSync('kubectl', ['get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}'], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.trim().split(' ').filter(Boolean);
}
```

```javascript
// lib/namespace.js - nahradit funkci getCurrentNamespace
function getCurrentNamespace() {
  try {
    const result = spawnSync('kubectl', ['config', 'view', '--minify', '-o', 'jsonpath={..namespace}'], { encoding: 'utf8' });
    return result.stdout.trim() || 'default';
  } catch {
    return 'default';
  }
}
```

```javascript
// lib/namespace.js - nahradit funkci setNamespace
function setNamespace(ns) {
  spawnSync('kubectl', ['config', 'set-context', '--current', `--namespace=${ns}`], { encoding: 'utf8' });
}
```

**Step 2: Odstranit dead code (select === -1)**

```javascript
// lib/namespace.js - nahradit radky 40-44 ve funkci useNamespace
const namespaces = getNamespaces();
const selected = await select({question: 'Select namespace:', options: namespaces, autocomplete: true});
if (!selected) return;
newNs = selected;
```

**Step 3: Commit**

```bash
git add lib/namespace.js
git commit -m "fix(security): prevent command injection in namespace.js"
```

---

## Task 5: Opravit command injection v misc.js

**Files:**
- Modify: `lib/misc.js`

**Step 1: Nahradit cp.execSync za spawnSync**

```javascript
// lib/misc.js - nahradit radek 1
const { spawnSync } = require('child_process');
```

```javascript
// lib/misc.js - nahradit funkci getContexts
const getContexts = () => {
    const result = spawnSync('kubectl', ['config', 'get-contexts'], { encoding: 'utf-8' });
    if (result.status !== 0) return [];
    const namespacesRaw = result.stdout;
    const split = namespacesRaw.trim().split('\n');
    split.shift();
    return split.map(line => {
        const current = SELECTED_CONTEXT_REGEX.test(line);
        const lineSplit = current ? line.split(SELECTED_CONTEXT_REGEX)[1].trim().split(/\s/) : line.trim().split(/\s/);
        return {name: lineSplit[0], current};
    });
};
```

```javascript
// lib/misc.js - nahradit funkci selectNamespace
const selectNamespace = (context) => {
    const result = spawnSync('kubectl', ['get', 'ns', '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) return select({question: 'select namespace', options: [], autocomplete: true});
    const nsRaw = result.stdout;
    const nsSplit = nsRaw.trim().split('\n');
    nsSplit.shift();
    const namespaces = nsSplit.map(s => s.trim().split(/\s/).shift());
    return select({question: 'select namespace', options: namespaces, autocomplete: true});
};
```

```javascript
// lib/misc.js - nahradit funkci selectResource
const selectResource = (resource, context, namespace) => {
    const result = spawnSync('kubectl', ['get', `${resource}s`, '--namespace', namespace, '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) return select({question: `select ${resource}`, options: [], autocomplete: true});
    const podsRaw = result.stdout;
    const resourceSplit = podsRaw.trim().split('\n');
    resourceSplit.shift();
    const resources = resourceSplit.map(s => s.trim().split(/\s/).shift());
    return select({question: `select ${resource}`, options: resources, autocomplete: true});
};
```

**Step 2: Commit**

```bash
git add lib/misc.js
git commit -m "fix(security): prevent command injection in misc.js"
```

---

## Task 6: Opravit command injection v copy.js

**Files:**
- Modify: `lib/copy.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/copy.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/copy.js - nahradit radky 33-37
if (direction === 0) {
  spawnSync('kubectl', ['cp', `${ns}/${selectedPod.name}:${remotePath}`, localPath], { stdio: 'inherit' });
} else {
  spawnSync('kubectl', ['cp', localPath, `${ns}/${selectedPod.name}:${remotePath}`], { stdio: 'inherit' });
}
```

```javascript
// lib/copy.js - nahradit radek 58
spawnSync('kubectl', ['cp', `${ns}/${selectedPod.name}:${pathPart}`, dest], { stdio: 'inherit' });
```

```javascript
// lib/copy.js - nahradit radek 73
spawnSync('kubectl', ['cp', src, `${ns}/${selectedPod.name}:${pathPart}`], { stdio: 'inherit' });
```

**Step 2: Odstranit dead code (select === -1)**

```javascript
// lib/copy.js - nahradit radky 19-22
const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
if (!selected) return;
const idx = displayNames.indexOf(selected);
```

```javascript
// lib/copy.js - nahradit radky 26-28
const directionSel = await select({question: 'Copy direction:', options: directions});
if (!directionSel) return;
const direction = directions.indexOf(directionSel);
```

**Step 3: Commit**

```bash
git add lib/copy.js
git commit -m "fix(security): prevent command injection in copy.js"
```

---

## Task 7: Opravit command injection v get-resources.js

**Files:**
- Modify: `lib/get-resources.js`

**Step 1: Nahradit execSync za spawnSync a pridat validaci**

```javascript
// lib/get-resources.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/get-resources.js - nahradit funkci getResources
const getResources = async (resourceType, allNamespaces = false) => {
  let resource;
  if (resourceType) {
    resource = resolveResourceType(resourceType);
    // Validace ze resource je znamý
    if (!Object.values(RESOURCE_ALIASES).includes(resource) && !Object.keys(RESOURCE_ALIASES).includes(resourceType.toLowerCase())) {
      console.log(`Unknown resource type: ${resourceType}`);
      console.log(`Valid types: ${RESOURCE_OPTIONS.join(', ')}`);
      return;
    }
  } else {
    const selected = await select({question: 'Select resource:', options: RESOURCE_OPTIONS, autocomplete: true});
    if (!selected) return;
    resource = selected;
  }

  const args = ['get', resource];
  if (allNamespaces) {
    args.push('--all-namespaces');
  } else {
    args.push('-n', getCurrentNamespace());
  }

  const cmd = `kubectl ${args.join(' ')}`;
  configuration.put({[lastCommandKey]: cmd});

  const result = spawnSync('kubectl', args, { encoding: 'utf8' });

  if (result.stdout) {
    console.log(colorizeOutput(result.stdout));
  }
  if (result.stderr) {
    console.error(result.stderr);
  }
};
```

**Step 2: Commit**

```bash
git add lib/get-resources.js
git commit -m "fix(security): validate resource type and use spawnSync in get-resources.js"
```

---

## Task 8: Opravit command injection v custom.js

**Files:**
- Modify: `lib/custom.js`

**Step 1: Pridat whitelist povolenych kubectl prikazu**

```javascript
// lib/custom.js - pridat na zacatek souboru po importech
const ALLOWED_KUBECTL_COMMANDS = ['get', 'describe', 'logs', 'exec', 'port-forward', 'top', 'rollout'];

function isCommandAllowed(command) {
  return ALLOWED_KUBECTL_COMMANDS.includes(command);
}
```

**Step 2: Nahradit execSync za spawnSync s validaci**

```javascript
// lib/custom.js - nahradit runCustomCommand
const runCustomCommand = async (commandName) => {
    if (!isCustomConfigValid) {
        console.log(`cannot run command ${commandName}, configuration is invalid`);
        return;
    }
    const commands = configuration.get()?.[customCommandsKey];
    const commandDefinition = commands.find(c => c.name === commandName);
    if (!commandDefinition) {
        console.log(`cannot run command ${commandName}, command does not exist`);
        return;
    }

    const {repeatable, resource, command, flags, description} = commandDefinition;

    // Validace prikazu
    if (!isCommandAllowed(command)) {
        console.log(`Command "${command}" is not allowed. Allowed: ${ALLOWED_KUBECTL_COMMANDS.join(', ')}`);
        return;
    }

    console.log(description);
    const context = await selectContext();
    const namespace = await selectNamespace(context);
    const selectedResource = await selectResource(resource, context, namespace);

    const args = [command, `${resource}/${selectedResource}`, '--namespace', namespace, '--context', context];
    if (flags) {
        args.push(...flags.split(/\s+/).filter(Boolean));
    }

    const cmd = `kubectl ${args.join(' ')}`;
    if (repeatable) {
        configuration.put({[lastCommandKey]: cmd});
    }
    console.log(cmd);
    cp.spawnSync('kubectl', args, {stdio: 'inherit'});
};
```

**Step 3: Pridat semicolons**

Pridat `;` na konec vsech radku kde chybi.

**Step 4: Commit**

```bash
git add lib/custom.js
git commit -m "fix(security): validate custom commands against whitelist"
```

---

## Task 9: Opravit command injection v repeat-command.js

**Files:**
- Modify: `lib/repeat-command.js`

**Step 1: Pridat validaci ulozeneho prikazu**

```javascript
// lib/repeat-command.js - kompletni nahrada
const {configuration, lastCommandKey} = require("./config");
const { spawnSync } = require('node:child_process');

// Pouze kubectl prikazy jsou povoleny
function isValidCommand(command) {
  if (!command || typeof command !== 'string') return false;
  const trimmed = command.trim();
  // Prikaz musi zacinat 'kubectl '
  if (!trimmed.startsWith('kubectl ')) return false;
  // Nesmi obsahovat nebezpecne znaky
  if (/[;&|`$()]/.test(trimmed)) return false;
  return true;
}

function parseKubectlCommand(command) {
  // Odstrani 'kubectl ' prefix a rozparsuje argumenty
  const withoutPrefix = command.replace(/^kubectl\s+/, '');
  // Jednoduchy split - nepodporuje uvozovky, ale to pro nase ucely staci
  return withoutPrefix.split(/\s+/).filter(Boolean);
}

const repeatCommand = () => {
    const command = configuration.get()?.[lastCommandKey];
    if (!command) {
        console.log('no command to repeat');
        return;
    }

    if (!isValidCommand(command)) {
        console.log('stored command is invalid or potentially unsafe');
        return;
    }

    console.log('repeating last executed command');
    console.log(command);

    const args = parseKubectlCommand(command);
    spawnSync('kubectl', args, {stdio: 'inherit'});
};

module.exports = {repeatCommand};
```

**Step 2: Commit**

```bash
git add lib/repeat-command.js
git commit -m "fix(security): validate stored command before execution"
```

---

## Task 10: Opravit command injection v describe.js

**Files:**
- Modify: `lib/describe.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/describe.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/describe.js - nahradit radek 52
const result = spawnSync('kubectl', ['describe', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
if (result.stdout) {
  console.log(colorizeDescribe(result.stdout));
}
if (result.stderr) {
  console.error(result.stderr);
}
```

**Step 2: Odstranit dead code a opravit indexOf bug**

```javascript
// lib/describe.js - nahradit radky 38-41
const displayNames = filtered.map(f => podNames[f.originalIndex]);
const selected = await select({ question: 'Select pod:', options: displayNames, autocomplete: true });
if (!selected) return;
const selectedIdx = displayNames.indexOf(selected);
selectedPod = pods[filtered[selectedIdx].originalIndex];
```

```javascript
// lib/describe.js - nahradit radky 45-48
const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
const selected = await select({ question: 'Select pod to describe:', options: displayNames, autocomplete: true });
if (!selected) return;
const selectedIdx = displayNames.indexOf(selected);
```

**Step 3: Commit**

```bash
git add lib/describe.js
git commit -m "fix(security): use spawnSync and fix indexOf bug in describe.js"
```

---

## Task 11: Opravit command injection v env.js

**Files:**
- Modify: `lib/env.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/env.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/env.js - nahradit radky 53-58
try {
  const result = spawnSync('kubectl', ['exec', '-n', ns, selectedPod.name, '--', 'env'], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.log(colorize('Failed to get env. Pod might not be running.', 'red'));
    return;
  }
  console.log(formatEnvOutput(result.stdout));
} catch (err) {
  console.log(colorize('Failed to get env. Pod might not be running.', 'red'));
}
```

**Step 2: Odstranit dead code a opravit indexOf bug**

```javascript
// lib/env.js - nahradit radky 38-41
const displayNames = filtered.map(f => podNames[f.originalIndex]);
const selected = await select({ question: 'Select pod:', options: displayNames, autocomplete: true });
if (!selected) return;
const selectedIdx = displayNames.indexOf(selected);
selectedPod = pods[filtered[selectedIdx].originalIndex];
```

```javascript
// lib/env.js - nahradit radky 45-48
const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
const selected = await select({ question: 'Select pod:', options: displayNames, autocomplete: true });
if (!selected) return;
const selectedIdx = displayNames.indexOf(selected);
```

**Step 3: Commit**

```bash
git add lib/env.js
git commit -m "fix(security): use spawnSync and fix indexOf bug in env.js"
```

---

## Task 12: Opravit command injection v delete.js

**Files:**
- Modify: `lib/delete.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/delete.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/delete.js - nahradit radek 55
spawnSync('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { stdio: 'inherit' });
```

**Step 2: Odstranit dead code**

```javascript
// lib/delete.js - nahradit radky 30-33
const displayNames = filtered.map(f => podNames[f.originalIndex]);
const selected = await select({question: 'Select pod to delete:', options: displayNames, autocomplete: true});
if (!selected) return;
const idx = displayNames.indexOf(selected);
```

```javascript
// lib/delete.js - nahradit radky 37-40
const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
const selected = await select({question: 'Select pod to delete:', options: displayNames, autocomplete: true});
if (!selected) return;
const idx = displayNames.indexOf(selected);
```

**Step 3: Commit**

```bash
git add lib/delete.js
git commit -m "fix(security): use spawnSync in delete.js"
```

---

## Task 13: Opravit command injection v restart.js

**Files:**
- Modify: `lib/restart.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/restart.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/restart.js - nahradit radky 47-52
try {
  const result = spawnSync('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.log(colorize('Failed to restart pod', 'red'));
    return;
  }
  console.log(colorize('Pod deleted. Kubernetes will recreate it.', 'green'));
} catch (err) {
  console.log(colorize('Failed to restart pod', 'red'));
}
```

**Step 2: Odstranit dead code**

```javascript
// lib/restart.js - nahradit radky 30-33
const displayNames = filtered.map(f => podNames[f.originalIndex]);
const selected = await select({question: 'Select pod to restart:', options: displayNames, autocomplete: true});
if (!selected) return;
const idx = displayNames.indexOf(selected);
```

```javascript
// lib/restart.js - nahradit radky 37-40
const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
const selected = await select({question: 'Select pod to restart:', options: displayNames, autocomplete: true});
if (!selected) return;
const idx = displayNames.indexOf(selected);
```

**Step 3: Commit**

```bash
git add lib/restart.js
git commit -m "fix(security): use spawnSync in restart.js"
```

---

## Task 14: Opravit command injection v logs.js a odstranit duplicitni getPods

**Files:**
- Modify: `lib/logs.js`

**Step 1: Nahradit execSync za spawnSync a importovat getPods z exec.js**

```javascript
// lib/logs.js - nahradit radky 1-6
const { spawnSync, spawn } = require('child_process');
const { select } = require('./cli');
const { fuzzyFilter } = require('./fuzzy');
const { getCurrentNamespace } = require('./namespace');
const { getPods } = require('./exec');
```

**Step 2: Opravit getServicePods a getServices**

```javascript
// lib/logs.js - nahradit funkci getServicePods
function getServicePods(serviceName, namespace) {
  try {
    const selectorResult = spawnSync(
      'kubectl', ['get', 'service', serviceName, '-n', namespace, '-o', 'jsonpath={.spec.selector}'],
      { encoding: 'utf8' }
    );
    if (selectorResult.status !== 0) return [];

    const selector = JSON.parse(selectorResult.stdout.replace(/'/g, '"'));
    const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');

    const podsResult = spawnSync(
      'kubectl', ['get', 'pods', '-n', namespace, '-l', labelSelector, '-o', 'jsonpath={.items[*].metadata.name}'],
      { encoding: 'utf8' }
    );
    if (podsResult.status !== 0) return [];
    return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}
```

```javascript
// lib/logs.js - nahradit funkci getServices
function getServices(allNamespaces = false) {
  const args = ['get', 'services', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  try {
    const result = spawnSync('kubectl', args, { encoding: 'utf8' });
    if (result.status !== 0) return [];
    return result.stdout.trim().split('\n').filter(Boolean).map(line => {
      const [name, namespace] = line.split('\t');
      return { name, namespace };
    });
  } catch {
    return [];
  }
}
```

**Step 3: Odstranit duplicitni getPods funkci**

Smazat radky 7-19 (lokalni getPods funkci) - uz importujeme z exec.js.

**Step 4: Odstranit dead code (select === -1)**

Nahradit vsechny `if (selected === -1) return;` za `if (!selected) return;`

**Step 5: Commit**

```bash
git add lib/logs.js
git commit -m "fix(security): use spawnSync in logs.js and import getPods from exec.js"
```

---

## Task 15: Opravit command injection v events.js

**Files:**
- Modify: `lib/events.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/events.js - nahradit radek 2
const { spawnSync } = require('child_process');
```

```javascript
// lib/events.js - nahradit try blok ve funkci showEvents
try {
  const args = ['get', 'events', '--sort-by=.lastTimestamp', '-o', 'jsonpath={range .items[*]}{.type}{"\\t"}{.reason}{"\\t"}{.message}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  const result = spawnSync('kubectl', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.log(colorize('Failed to get events', 'red'));
    return;
  }

  const output = result.stdout;
  // zbytek funkce zustava stejny
```

**Step 2: Commit**

```bash
git add lib/events.js
git commit -m "fix(security): use spawnSync in events.js"
```

---

## Task 16: Opravit exec.js - odstranit dead code a opravit indexOf bug

**Files:**
- Modify: `lib/exec.js`

**Step 1: Nahradit execSync za spawnSync**

```javascript
// lib/exec.js - nahradit radek 2
const { spawnSync, spawn } = require('child_process');
```

```javascript
// lib/exec.js - nahradit funkci getPods
function getPods(allNamespaces = false) {
  const args = ['get', 'pods', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  try {
    const result = spawnSync('kubectl', args, { encoding: 'utf8' });
    if (result.status !== 0) return [];
    return result.stdout.trim().split('\n').filter(Boolean).map(line => {
      const [name, namespace] = line.split('\t');
      return { name, namespace };
    });
  } catch {
    return [];
  }
}
```

**Step 2: Odstranit dead code a opravit indexOf bug**

```javascript
// lib/exec.js - nahradit radky 42-47
const displayNames = filtered.map(f => podNames[f.originalIndex]);
const selected = await select({question: 'Select pod:', options: displayNames, autocomplete: true});
if (!selected) return;
// Find the original pod from the selected display name
const selectedIdx = displayNames.indexOf(selected);
selectedPod = pods[filtered[selectedIdx].originalIndex];
```

```javascript
// lib/exec.js - nahradit radky 51-54
const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
const selected = await select({question: 'Select pod to exec into:', options: displayNames, autocomplete: true});
if (!selected) return;
const selectedIdx = displayNames.indexOf(selected);
```

**Step 3: Commit**

```bash
git add lib/exec.js
git commit -m "fix: use spawnSync and fix indexOf bug in exec.js"
```

---

## Task 17: Opravit port-forward.js - dead code a pridat allNamespaces

**Files:**
- Modify: `lib/port-forward.js`

**Step 1: Pridat allNamespaces parametr**

```javascript
// lib/port-forward.js - zmenit signaturu funkce
async function portForward(resourceType, allNamespaces = false) {
```

**Step 2: Pouzit allNamespaces v getServices a getPods volani**

```javascript
// lib/port-forward.js - nahradit funkci getServices lokalni implementaci
function getServices(allNamespaces = false) {
  const { spawnSync } = require('child_process');
  const args = ['get', 'services', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  try {
    const result = spawnSync('kubectl', args, { encoding: 'utf8' });
    if (result.status !== 0) return [];
    return result.stdout.trim().split('\n').filter(Boolean).map(line => {
      const [name, namespace] = line.split('\t');
      return { name, namespace };
    });
  } catch {
    return [];
  }
}
```

**Step 3: Opravit volani getPods**

```javascript
// lib/port-forward.js - nahradit radek 34
const pods = getPods(allNamespaces);
```

**Step 4: Odstranit dead code**

```javascript
// lib/port-forward.js - nahradit select kontroly
const selected = await select({question: 'Select service:', options: services.map(s => s.name), autocomplete: true});
if (!selected) return;
```

**Step 5: Commit**

```bash
git add lib/port-forward.js
git commit -m "fix: add allNamespaces support to port-forward.js"
```

---

## Task 18: Opravit index.js - pridat await a opravit typo

**Files:**
- Modify: `lib/index.js`

**Step 1: Pridat await k repeatCommand**

```javascript
// lib/index.js - nahradit radky 96-98
case 'r':
    await repeatCommand();
    break;
```

**Step 2: Opravit typo "agrument" -> "argument"**

```javascript
// lib/index.js - nahradit radek 118
console.log('unsupported command line argument:', cmd);
```

**Step 3: Predat allNamespaces do portForward**

```javascript
// lib/index.js - nahradit radky 36-38
case 'pf':
    await portForward('pod', flags.allNamespaces);
    break;
```

```javascript
// lib/index.js - nahradit radky 43-45
case 'pfs':
    await portForward('service', flags.allNamespaces);
    break;
```

**Step 4: Commit**

```bash
git add lib/index.js
git commit -m "fix: add await to repeatCommand and fix typo"
```

---

## Task 19: Opravit config.js - zmenit .laku na .klazy

**Files:**
- Modify: `lib/config.js`

**Step 1: Zmenit config path**

```javascript
// lib/config.js - nahradit radek 5
const configPath = path.join(os.homedir(), '.klazy');
```

**Step 2: Commit**

```bash
git add lib/config.js
git commit -m "fix: rename config file from .laku to .klazy"
```

---

## Task 20: Opravit cli.js - JSDoc a empty options guard

**Files:**
- Modify: `lib/cli.js`

**Step 1: Aktualizovat JSDoc pro select**

```javascript
// lib/cli.js - nahradit JSDoc pred select funkci (radky 33-39)
/**
 * Interactive selection from options list
 * @param {{question: string, options: string[], pointer?: number, autocomplete?: boolean}} config
 * @returns {Promise<string>} Selected option string, or empty string if cancelled/no options
 */
```

**Step 2: Pridat guard pro prazdny options array**

```javascript
// lib/cli.js - pridat na zacatek select funkce (po radku 40)
if (!options || options.length === 0) {
    console.log('No options available');
    return '';
}
```

**Step 3: Commit**

```bash
git add lib/cli.js
git commit -m "fix: add empty options guard and update JSDoc in cli.js"
```

---

## Task 21: Standardizovat node: prefix v importech

**Files:**
- Modify: Multiple files

**Step 1: Standardizovat na require('node:...') format**

V nasledujicich souborech zmenit `require('child_process')` na `require('node:child_process')`:
- `lib/context.js`
- `lib/namespace.js`
- `lib/copy.js`
- `lib/get-resources.js`
- `lib/misc.js`
- `lib/describe.js`
- `lib/env.js`
- `lib/delete.js`
- `lib/restart.js`
- `lib/logs.js`
- `lib/events.js`
- `lib/exec.js`
- `lib/port-forward.js`

Podobne pro `require('path')` -> `require('node:path')`, `require('fs')` -> `require('node:fs')`, atd.

**Step 2: Commit**

```bash
git add lib/*.js
git commit -m "style: standardize node: prefix in imports"
```

---

## Task 22: Odstranit nepouzitou COMMANDS konstantu z completion.js

**Files:**
- Modify: `lib/completion.js`

**Step 1: Odstranit nepouzitou konstantu**

```javascript
// lib/completion.js - smazat radek 2
// const COMMANDS = ['c', 'cs', 'ns', 'get', ...]; // smazat
```

**Step 2: Commit**

```bash
git add lib/completion.js
git commit -m "refactor: remove unused COMMANDS constant from completion.js"
```

---

## Task 23: Pouzit nebo odstranit validatePort z misc.js

**Files:**
- Modify: `lib/misc.js`
- Modify: `lib/port-forward.js`

**Step 1: Exportovat validatePort z misc.js**

```javascript
// lib/misc.js - pridat do module.exports
module.exports = {getContexts, selectContext, selectNamespace, selectResource, selectPort, validatePort};
```

**Step 2: Pouzit v port-forward.js**

```javascript
// lib/port-forward.js - pridat import
const { validatePort } = require('./misc');
```

```javascript
// lib/port-forward.js - pouzit ve validaci
localPort = await input({question: 'Local port', validationCallback: validatePort});
remotePort = await input({question: 'Remote port', defaultValue: localPort, validationCallback: validatePort});
```

**Step 3: Commit**

```bash
git add lib/misc.js lib/port-forward.js
git commit -m "refactor: use validatePort from misc.js in port-forward.js"
```

---

## Task 24: Finalni verifikace

**Step 1: Linkovat a otestovat**

```bash
cd /Users/discotrooper/Desktop/Coding/klazy
npm link
```

**Step 2: Otestovat zakladni prikazy**

```bash
klazy h
klazy cs
klazy c kind-klazy-test
klazy ns default
klazy get pods
klazy exec redis
klazy desc redis
klazy logs redis
klazy events
klazy restart redis
klazy top
```

**Step 3: Otestovat bezpecnost**

```bash
klazy c "test; echo hacked"    # melo by prepnout na context "test; echo hacked" nebo selhat
klazy ns "test; echo hacked"   # melo by prepnout na namespace "test; echo hacked" nebo selhat
klazy get "pods; echo hacked"  # melo by rict "Unknown resource type"
```

**Step 4: Commit finalni stav**

```bash
git add -A
git commit -m "chore: complete code review fixes"
```

---

## Souhrn

| Task | Popis | Soubory |
|------|-------|---------|
| 1 | Kubectl helper | kubectl.js (novy) |
| 2-3 | context.js opravy | context.js |
| 4 | namespace.js opravy | namespace.js |
| 5 | misc.js opravy | misc.js |
| 6 | copy.js opravy | copy.js |
| 7 | get-resources.js opravy | get-resources.js |
| 8 | custom.js opravy | custom.js |
| 9 | repeat-command.js opravy | repeat-command.js |
| 10 | describe.js opravy | describe.js |
| 11 | env.js opravy | env.js |
| 12 | delete.js opravy | delete.js |
| 13 | restart.js opravy | restart.js |
| 14 | logs.js opravy | logs.js |
| 15 | events.js opravy | events.js |
| 16 | exec.js opravy | exec.js |
| 17 | port-forward.js opravy | port-forward.js |
| 18 | index.js opravy | index.js |
| 19 | config.js opravy | config.js |
| 20 | cli.js opravy | cli.js |
| 21 | Node prefix | vsechny lib/*.js |
| 22 | completion.js cleanup | completion.js |
| 23 | validatePort | misc.js, port-forward.js |
| 24 | Verifikace | - |
