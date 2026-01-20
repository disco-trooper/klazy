# TypeScript Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevest klazy z JavaScript do TypeScript se zachovanim 0 runtime dependencies

**Architecture:** Zdrojaky v src/*.ts, TypeScript kompiluje do lib/*.js (CommonJS). DevDependencies pouze typescript a @types/node - zadne runtime dependencies.

**Tech Stack:** TypeScript 5.x, @types/node 22.x, Node.js 20+

---

## Task 1: Setup TypeScript projektu

**Files:**
- Create: `tsconfig.json`
- Modify: `package.json`

**Step 1: Vytvorit tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./lib",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 2: Aktualizovat package.json**

Pridat do existujiciho package.json:

```json
{
  "main": "lib/index.js",
  "bin": {
    "klazy": "./lib/index.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

**Step 3: Instalovat devDependencies**

Run: `npm install`

**Step 4: Commit**

```bash
git add tsconfig.json package.json package-lock.json
git commit -m "chore: setup TypeScript configuration"
```

---

## Task 2: Presunout soubory do src/ a prejmenovat na .ts

**Files:**
- Create: `src/` directory
- Move: all `lib/*.js` -> `src/*.ts`

**Step 1: Vytvorit src/ adresar**

```bash
mkdir -p src
```

**Step 2: Presunout a prejmenovat soubory**

```bash
for f in lib/*.js; do
  filename=$(basename "$f" .js)
  cp "$f" "src/${filename}.ts"
done
```

**Step 3: Smazat stare JS soubory z lib/**

```bash
rm lib/*.js
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: move JS files to src/ as .ts"
```

---

## Task 3: Vytvorit types.ts se sdilenymi typy

**Files:**
- Create: `src/types.ts`

**Step 1: Vytvorit soubor s typy**

```typescript
// src/types.ts

export interface Pod {
  name: string;
  namespace: string;
}

export interface Service {
  name: string;
  namespace: string;
}

export interface Context {
  name: string;
  current: boolean;
}

export interface KlazyConfig {
  previousNamespace?: string;
  previousContext?: string;
  lastCommand?: string;
  custom?: CustomCommand[];
}

export interface CustomCommand {
  name: string;
  repeatable: boolean;
  resource: 'pod' | 'service';
  command: string;
  flags: string;
  description: string | string[];
}

export interface FuzzyResult {
  item: string;
  originalIndex: number;
}

export interface SelectConfig {
  question: string;
  options: string[];
  pointer?: number;
  autocomplete?: boolean;
}

export interface InputConfig {
  question: string;
  invalidWarning?: string;
  defaultValue?: string;
  validationCallback?: (answer: string) => boolean;
}

export interface Flags {
  allNamespaces: boolean;
  force: boolean;
  noFollow: boolean;
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript interfaces"
```

---

## Task 4: Konvertovat colors.ts

**Files:**
- Modify: `src/colors.ts`

**Step 1: Prepsat na TypeScript**

```typescript
// src/colors.ts

const RESET = '\x1b[0m';

const COLORS: Record<string, string> = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

export function colorize(text: string, color: string): string {
  const colorCode = COLORS[color];
  if (!colorCode) return text;
  return `${colorCode}${text}${RESET}`;
}

export function colorizeStatus(status: string): string {
  const statusColors: Record<string, string> = {
    Running: 'green',
    Completed: 'green',
    Succeeded: 'green',
    Ready: 'green',
    True: 'green',
    Normal: 'green',
    Pending: 'yellow',
    ContainerCreating: 'yellow',
    Warning: 'yellow',
    Error: 'red',
    Failed: 'red',
    CrashLoopBackOff: 'red',
    ImagePullBackOff: 'red',
    Terminated: 'red',
    NotReady: 'red',
    False: 'red',
  };
  const color = statusColors[status];
  return color ? colorize(status, color) : status;
}
```

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit src/colors.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/colors.ts
git commit -m "feat: convert colors.ts to TypeScript"
```

---

## Task 5: Konvertovat fuzzy.ts

**Files:**
- Modify: `src/fuzzy.ts`

**Step 1: Prepsat na TypeScript**

```typescript
// src/fuzzy.ts

import type { FuzzyResult } from './types';

export function fuzzyMatch(text: string, pattern: string): boolean {
  const textLower = text.toLowerCase();
  const patternLower = pattern.toLowerCase();

  let patternIdx = 0;
  for (let i = 0; i < textLower.length && patternIdx < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIdx]) {
      patternIdx++;
    }
  }
  return patternIdx === patternLower.length;
}

export function fuzzyFilter(items: string[], pattern: string): FuzzyResult[] {
  if (!pattern) {
    return items.map((item, index) => ({ item, originalIndex: index }));
  }

  return items
    .map((item, index) => ({ item, originalIndex: index }))
    .filter(({ item }) => fuzzyMatch(item, pattern));
}
```

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit src/fuzzy.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/fuzzy.ts
git commit -m "feat: convert fuzzy.ts to TypeScript"
```

---

## Task 6: Konvertovat config.ts

**Files:**
- Modify: `src/config.ts`

**Step 1: Prepsat na TypeScript**

```typescript
// src/config.ts

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import type { KlazyConfig } from './types';

const configPath = path.join(os.homedir(), '.klazy');

export const lastCommandKey = 'lastCommand';
export const customCommandsKey = 'custom';

const defaultConfig: KlazyConfig = {
  previousNamespace: undefined,
  previousContext: undefined,
};

export function getConfig(): KlazyConfig {
  if (!fs.existsSync(configPath)) {
    return { ...defaultConfig };
  }

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(configPath, 'utf8');
  } catch {
    console.log('cannot read config file', configPath);
    return {};
  }

  try {
    return JSON.parse(rawContent) as KlazyConfig;
  } catch {
    console.log('corrupted config file', configPath);
    return {};
  }
}

export function writeConfig(config: KlazyConfig): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch {
    console.log('error writing to config file', configPath);
  }
}

let config = getConfig();

export const configuration = {
  get: (): KlazyConfig => config,
  put: (update: Partial<KlazyConfig>): void => {
    const currentConfig = getConfig();
    const mergedConfig = { ...currentConfig, ...update };
    writeConfig(mergedConfig);
    config = getConfig();
  },
};
```

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit src/config.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat: convert config.ts to TypeScript"
```

---

## Task 7: Konvertovat cli.ts

**Files:**
- Modify: `src/cli.ts`

**Step 1: Prepsat na TypeScript**

Toto je nejslozitejsi soubor. Klicove zmeny:

```typescript
// src/cli.ts

import { EventEmitter } from 'node:events';
import * as readline from 'node:readline';
import { fuzzyFilter } from './fuzzy';
import { colorizeStatus } from './colors';
import type { SelectConfig, InputConfig, FuzzyResult } from './types';

function colorizeOption(option: string): string {
  const statusMatch = option.match(/(Running|Pending|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff|Terminated)/);
  if (statusMatch) {
    return option.replace(statusMatch[0], colorizeStatus(statusMatch[0]));
  }
  return option;
}

const ARROW_UP = '\x1B[A';
const ARROW_DOWN = '\x1B[B';
const ENTER = '\x0D';
const CTRLC = '\x03';
const DELETE = '\x1B[3~';
const BACKSPACE = '\b';
const BACKSPACE2 = String.fromCharCode(127);
const ARROW_LEFT = '\x1B[D';
const ARROW_RIGHT = '\x1B[C';

const highlight = (str: string): string => `\x1b[1m${str}\x1b[22m <-`;
const write = (str: string): void => { process.stdout.write(str); };
const newline = (): void => write('\n');
const hideCursor = (): void => write('\x1B[?25l');
const showCursor = (): void => write('\x1B[?25h');
const makeBold = (str: string): string => `\x1b[1m${str}\x1b[22m`;

const CHOICES_ON_SCREEN = 5;
const AUTOCOMPLETE_LABEL = '>>> autocomplete: ';

export function select({ question, options, pointer, autocomplete }: SelectConfig): Promise<string> {
  if (!options || options.length === 0) {
    console.log('No options available');
    return Promise.resolve('');
  }

  if (!process.stdin.isTTY) {
    throw new Error('process stdin is not tty');
  }

  const emitter = new EventEmitter();
  let currentPointer: number;
  let visibleOptionsIndices: number[];
  let autocompleteString = '';
  let autoCompleteStringPointer = 0;
  let invalidSelection = false;

  // ... rest of the select function implementation
  // (copy full implementation from current file, add types to all variables)

  return new Promise<string>((resolve) => {
    emitter.on('selection', (selection: string) => resolve(selection));
  });
}

export function input({ question, invalidWarning, defaultValue, validationCallback = () => true }: InputConfig): Promise<string> {
  const emitter = new EventEmitter();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (): void => {
    const qstn = defaultValue ? `${question} [${defaultValue}]` : question;
    rl.question(`${qstn}: `, (answer: string) => {
      const isDefaultAnswer = defaultValue && answer === '';
      if (isDefaultAnswer) {
        emitter.emit('selection', defaultValue);
        rl.close();
        return;
      }
      if (validationCallback(answer)) {
        emitter.emit('selection', answer);
        rl.close();
      } else {
        console.log(invalidWarning || 'invalid answer');
        ask();
      }
    });
  };
  ask();

  return new Promise<string>((resolve) => {
    emitter.on('selection', (selection: string) => resolve(selection));
  });
}
```

**Poznamka:** cli.ts je dlouhy soubor (~385 radku). Kompletni konverze vyzaduje:
- Pridat typy ke vsem promennym ve funkci select()
- Typovat event handlery
- Typovat closure promenne

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit src/cli.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/cli.ts
git commit -m "feat: convert cli.ts to TypeScript"
```

---

## Task 8: Konvertovat namespace.ts

**Files:**
- Modify: `src/namespace.ts`

**Step 1: Prepsat na TypeScript**

```typescript
// src/namespace.ts

import { spawnSync } from 'node:child_process';
import { select } from './cli';
import { getConfig, writeConfig } from './config';
import { colorize } from './colors';

export function getNamespaces(): string[] {
  const result = spawnSync('kubectl', ['get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}'], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.trim().split(' ').filter(Boolean);
}

export function getCurrentNamespace(): string {
  try {
    const result = spawnSync('kubectl', ['config', 'view', '--minify', '-o', 'jsonpath={..namespace}'], { encoding: 'utf8' });
    return result.stdout.trim() || 'default';
  } catch {
    return 'default';
  }
}

function setNamespace(ns: string): void {
  spawnSync('kubectl', ['config', 'set-context', '--current', `--namespace=${ns}`], { encoding: 'utf8' });
}

export async function useNamespace(targetNs?: string): Promise<void> {
  const config = getConfig();
  const currentNs = getCurrentNamespace();

  let newNs: string;

  if (targetNs === '-') {
    if (!config.previousNamespace) {
      console.log('No previous namespace to switch to');
      return;
    }
    newNs = config.previousNamespace;
  } else if (targetNs) {
    newNs = targetNs;
  } else {
    const namespaces = getNamespaces();
    const selected = await select({ question: 'Select namespace:', options: namespaces, autocomplete: true });
    if (!selected) return;
    newNs = selected;
  }

  config.previousNamespace = currentNs;
  writeConfig(config);

  setNamespace(newNs);
  console.log(`Switched to namespace: ${colorize(newNs, 'magenta')}`);
}
```

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit src/namespace.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/namespace.ts
git commit -m "feat: convert namespace.ts to TypeScript"
```

---

## Task 9: Konvertovat context.ts

**Files:**
- Modify: `src/context.ts`

**Step 1: Prepsat na TypeScript**

```typescript
// src/context.ts

import { spawnSync } from 'node:child_process';
import { getContexts, selectContext } from './misc';
import { getConfig, writeConfig } from './config';
import { colorize } from './colors';
import type { Context } from './types';

export async function useContext(targetContext?: string): Promise<void> {
  const config = getConfig();

  let currentContext: string;
  try {
    const result = spawnSync('kubectl', ['config', 'current-context'], { encoding: 'utf8' });
    if (result.status !== 0) {
      console.log('Failed to get current context');
      return;
    }
    currentContext = result.stdout.trim();
  } catch (err) {
    console.log('Failed to get current context');
    return;
  }

  let newContext: string;

  if (targetContext === '-') {
    if (!config.previousContext) {
      console.log('No previous context to switch to');
      return;
    }
    newContext = config.previousContext;
  } else if (targetContext) {
    newContext = targetContext;
  } else {
    newContext = await selectContext();
  }

  config.previousContext = currentContext;
  writeConfig(config);

  const result = spawnSync('kubectl', ['config', 'use-context', newContext], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.log('Failed to switch context');
    return;
  }
  console.log(`Switched to context: ${colorize(newContext, 'cyan')}`);
}

export function showCurrentContext(): void {
  const contexts = getContexts();
  const current = contexts.find((c: Context) => c.current);
  if (!current) {
    console.log('No context currently selected');
    return;
  }
  console.log(`current context: ${colorize(current.name, 'cyan')}`);
}

export function showAllContexts(): void {
  spawnSync('kubectl', ['config', 'get-contexts'], { stdio: 'inherit' });
}
```

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit src/context.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/context.ts
git commit -m "feat: convert context.ts to TypeScript"
```

---

## Task 10: Konvertovat zbyvajici soubory (batch)

**Files:**
- Modify: `src/misc.ts`
- Modify: `src/exec.ts`
- Modify: `src/describe.ts`
- Modify: `src/env.ts`
- Modify: `src/delete.ts`
- Modify: `src/restart.ts`
- Modify: `src/events.ts`
- Modify: `src/logs.ts`
- Modify: `src/port-forward.ts`
- Modify: `src/copy.ts`
- Modify: `src/get-resources.ts`
- Modify: `src/custom.ts`
- Modify: `src/repeat-command.ts`
- Modify: `src/help.ts`
- Modify: `src/completion.ts`
- Modify: `src/metrics.ts`

**Pattern pro kazdy soubor:**

1. Zmenit `const { ... } = require('node:...')` na `import { ... } from 'node:...'`
2. Zmenit `const { ... } = require('./...')` na `import { ... } from './...'`
3. Zmenit `module.exports = { ... }` na `export { ... }` nebo `export function`
4. Pridat typy k function parameters a return values
5. Pridat `import type { Pod, Service, ... } from './types'` kde potreba

**Priklad pro exec.ts:**

```typescript
// src/exec.ts

import { spawnSync, spawn } from 'node:child_process';
import { select } from './cli';
import { fuzzyFilter } from './fuzzy';
import { getCurrentNamespace } from './namespace';
import type { Pod } from './types';

export function getPods(allNamespaces = false): Pod[] {
  const args = ['get', 'pods', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
  if (allNamespaces) args.splice(2, 0, '--all-namespaces');

  try {
    const result = spawnSync('kubectl', args, { encoding: 'utf8' });
    if (result.status !== 0) return [];
    return result.stdout.trim().split('\n').filter(Boolean).map((line: string) => {
      const [name, namespace] = line.split('\t');
      return { name, namespace };
    });
  } catch {
    return [];
  }
}

export async function execIntoPod(searchTerm?: string, allNamespaces = false): Promise<void> {
  // ... implementation with types
}
```

**Step 1: Konvertovat vsechny soubory**

Pro kazdy soubor aplikovat pattern vyse.

**Step 2: Overit kompilaci vsech souboru**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/*.ts
git commit -m "feat: convert remaining files to TypeScript"
```

---

## Task 11: Konvertovat index.ts (entry point)

**Files:**
- Modify: `src/index.ts`

**Step 1: Prepsat na TypeScript**

```typescript
#!/usr/bin/env node

import { useContext, showCurrentContext, showAllContexts } from './context';
import { printHelp } from './help';
import { portForward } from './port-forward';
import { getResources } from './get-resources';
import { repeatCommand } from './repeat-command';
import { isCustomCommand, runCustomCommand } from './custom';
import { streamLogs } from './logs';
import type { Flags } from './types';

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const flags: Flags = {
    allNamespaces: args.includes('-a') || args.includes('--all-namespaces'),
    force: args.includes('-f') || args.includes('--force'),
    noFollow: args.includes('--no-follow'),
  };
  const cmd = args.find((a: string) => !a.startsWith('-'));

  if (!cmd) {
    printHelp();
    return;
  }

  switch (cmd) {
    case 'c': {
      const ctxArg = args.find((a: string, i: number) => i > args.indexOf('c') && (!a.startsWith('-') || a === '-'));
      await useContext(ctxArg);
      break;
    }
    case 'cs':
      showCurrentContext();
      break;
    case 'csa':
      showAllContexts();
      break;
    // ... rest of switch cases with types
    default:
      if (isCustomCommand(cmd)) {
        await runCustomCommand(cmd);
        return;
      }
      console.log('unsupported command line argument:', cmd);
      printHelp();
  }
};

main().catch((e: Error) => console.log(e));
```

**Step 2: Overit kompilaci**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: convert index.ts entry point to TypeScript"
```

---

## Task 12: Build a verifikace

**Step 1: Spustit TypeScript kompilaci**

Run: `npm run build`
Expected: No errors, lib/ obsahuje .js, .js.map, .d.ts soubory

**Step 2: Overit vystup**

Run: `ls lib/`
Expected: index.js, index.d.ts, index.js.map, ... pro vsechny soubory

**Step 3: Linkovat a otestovat**

```bash
npm link
klazy h
klazy cs
klazy get pods
```

Expected: Vsechny prikazy funguji jako predtim

**Step 4: Overit zero runtime deps**

Run: `npm ls --prod --depth=0`
Expected: Prazdny vystup (zadne production dependencies)

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: complete TypeScript conversion"
```

---

## Souhrn

| Task | Soubory | Slozitost |
|------|---------|-----------|
| 1 | tsconfig.json, package.json | Setup |
| 2 | mv lib/*.js src/*.ts | Setup |
| 3 | types.ts | Low |
| 4 | colors.ts | Low |
| 5 | fuzzy.ts | Low |
| 6 | config.ts | Low |
| 7 | cli.ts | High |
| 8 | namespace.ts | Medium |
| 9 | context.ts | Medium |
| 10 | 16 remaining files | Medium |
| 11 | index.ts | Medium |
| 12 | Build + verify | Final |

---

## Paralelizacni skupiny

Tasky, ktere mohou bezet paralelne (po dokonceni setup):

**Sekvencni setup:**
- Task 1: tsconfig.json + package.json + npm install
- Task 2: mv lib/*.js -> src/*.ts
- Task 3: types.ts

**Skupina A (zakladni utility):** Task 4, 5, 6
- colors.ts, fuzzy.ts, config.ts
- Zadne zavislosti mezi sebou

**Skupina B (po A):** Task 7, 8, 9
- cli.ts, namespace.ts, context.ts
- Zavisi na colors, fuzzy, config

**Skupina C (po B):** Task 10 (batch 16 souboru)
- misc, exec, describe, env, delete, restart, events, logs, port-forward, copy, get-resources, custom, repeat-command, help, completion, metrics
- Zavisi na cli, namespace, config

**Finalni:**
- Task 11: index.ts (entry point)
- Task 12: Build + verifikace

---

## Verifikace

```bash
# Build
npm run build

# Overit vystup
ls lib/*.js lib/*.d.ts

# Test CLI
npm link
klazy h
klazy cs
klazy get pods
klazy exec redis
klazy logs redis
klazy events

# Zero runtime deps
npm ls --prod --depth=0
# (prazdny vystup = uspech)
```
