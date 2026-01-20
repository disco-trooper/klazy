"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.input = exports.select = void 0;
const node_events_1 = require("node:events");
const readline = __importStar(require("node:readline"));
const fuzzy_1 = require("./fuzzy");
const colors_1 = require("./colors");
// Helper function to colorize status in option text
function colorizeOption(option) {
    const statusMatch = option.match(/(Running|Pending|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff|Terminated)/);
    if (statusMatch) {
        return option.replace(statusMatch[0], (0, colors_1.colorizeStatus)(statusMatch[0]));
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
const highlight = (str) => `${makeBold(str)} <-`;
const write = (str) => process.stdout.write(str);
const newline = () => write('\n');
const hideCursor = () => write('\x1B[?25l');
const showCursor = () => write('\x1B[?25h');
const makeBold = (str) => `\x1b[1m${str}\x1b[22m`;
const CHOICES_ON_SCREEN = 5;
const AUTOCOMPLETE_LABEL = '>>> autocomplete: ';
/**
 * Interactive selection from options list
 */
const select = ({ question, options, pointer, autocomplete }) => {
    if (!options || options.length === 0) {
        console.log('No options available');
        return Promise.resolve('');
    }
    if (!process.stdin.isTTY) {
        throw new Error('process stdin is not tty (the script is run via child process probably..)');
    }
    const emitter = new node_events_1.EventEmitter();
    let currentPointer;
    let visibleOptionsIndices;
    let autocompleteString = '';
    let autoCompleteStringPointer = 0;
    let invalidSelection = false;
    function dataHandler(character) {
        switch (character) {
            case ARROW_UP:
                up();
                break;
            case ARROW_DOWN:
                down();
                break;
            case ENTER:
                enter();
                break;
            case CTRLC:
                ctrlc();
                break;
            default:
                autocompleteHandler(character);
        }
    }
    const isAutocompleteActive = () => !!(autocomplete && autocompleteString);
    const isRangeAlwaysVisible = () => options.length <= CHOICES_ON_SCREEN;
    const doAutoComplete = () => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        write(AUTOCOMPLETE_LABEL);
        write(autocompleteString);
        process.stdout.cursorTo(AUTOCOMPLETE_LABEL.length + autoCompleteStringPointer);
        const autocompleteCompliantIndices = getAutocompleteCompliantIndices();
        visibleOptionsIndices = autocompleteCompliantIndices.slice(0, CHOICES_ON_SCREEN);
        if (visibleOptionsIndices.length) {
            currentPointer = visibleOptionsIndices[0];
            invalidSelection = false;
        }
        else {
            currentPointer = -1;
            invalidSelection = true;
        }
        rePrint();
    };
    const getAutocompleteCompliantIndices = () => {
        const filtered = (0, fuzzy_1.fuzzyFilter)(options, autocompleteString);
        return filtered.map(f => f.originalIndex);
    };
    const autocompleteHandler = (character) => {
        if (!autocomplete) {
            return;
        }
        switch (character) {
            case ARROW_LEFT:
                if (autoCompleteStringPointer !== 0) {
                    autoCompleteStringPointer--;
                    process.stdout.moveCursor(-1, 0);
                }
                break;
            case ARROW_RIGHT:
                if (autoCompleteStringPointer !== autocompleteString.length) {
                    autoCompleteStringPointer++;
                    process.stdout.moveCursor(1, 0);
                }
                break;
            case DELETE:
                // DELETE removes character at cursor position, cursor stays in place
                if (autoCompleteStringPointer !== autocompleteString.length) {
                    autocompleteString = autocompleteString.substring(0, autoCompleteStringPointer) + autocompleteString.substring(autoCompleteStringPointer + 1);
                    doAutoComplete();
                }
                break;
            case BACKSPACE:
            case BACKSPACE2:
                if (autoCompleteStringPointer !== 0) {
                    autocompleteString = autocompleteString.substring(0, autoCompleteStringPointer - 1) + autocompleteString.substring(autoCompleteStringPointer);
                    autoCompleteStringPointer--;
                    doAutoComplete();
                }
                break;
            default:
                autocompleteString = autocompleteString.substring(0, autoCompleteStringPointer) + character + autocompleteString.substring(autoCompleteStringPointer);
                autoCompleteStringPointer++;
                doAutoComplete();
        }
    };
    const up = () => {
        if (invalidSelection) {
            return;
        }
        if (currentPointer === visibleOptionsIndices[0]) {
            if (isRangeAlwaysVisible()) {
                // just change the pointer
                currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                rePrint();
                return;
            }
            if (isAutocompleteActive()) {
                const autocompleteCompliantIndices = getAutocompleteCompliantIndices();
                if (autocompleteCompliantIndices.length <= CHOICES_ON_SCREEN) {
                    // just change the pointer
                    currentPointer = autocompleteCompliantIndices[autocompleteCompliantIndices.length - 1];
                    rePrint();
                    return;
                }
                // too many autocomplete compliant options => the visible range has to shift
                if (autocompleteCompliantIndices[0] === visibleOptionsIndices[0]) {
                    // overflow and shift the window to the bottom
                    visibleOptionsIndices = [];
                    for (let i = CHOICES_ON_SCREEN - 1; i >= 0; i--) {
                        visibleOptionsIndices.push(autocompleteCompliantIndices[autocompleteCompliantIndices.length - i - 1]);
                    }
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                }
                else {
                    // simple shift by one up
                    visibleOptionsIndices.pop();
                    const boundaryIndex = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[0]);
                    if (boundaryIndex === -1 || boundaryIndex === 0) {
                        visibleOptionsIndices.unshift(autocompleteCompliantIndices[autocompleteCompliantIndices.length - 1]);
                    }
                    else {
                        visibleOptionsIndices.unshift(autocompleteCompliantIndices[boundaryIndex - 1]);
                    }
                    currentPointer = visibleOptionsIndices[0];
                }
            }
            else {
                // shift the range of visible +options+ indices
                if (visibleOptionsIndices[0] === 0) {
                    // overflow and shift the window to the bottom
                    visibleOptionsIndices = [...Array(CHOICES_ON_SCREEN).keys()].map(i => i + options.length - CHOICES_ON_SCREEN);
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                }
                else {
                    // simple shift by one up
                    visibleOptionsIndices.pop();
                    visibleOptionsIndices.unshift(visibleOptionsIndices[0] - 1);
                    currentPointer = visibleOptionsIndices[0];
                }
            }
        }
        else {
            const index = visibleOptionsIndices.findIndex(i => i === currentPointer);
            currentPointer = visibleOptionsIndices[index - 1];
        }
        rePrint();
    };
    const down = () => {
        if (invalidSelection) {
            return;
        }
        if (currentPointer === visibleOptionsIndices[visibleOptionsIndices.length - 1]) {
            if (isRangeAlwaysVisible()) {
                // just change the pointer
                currentPointer = visibleOptionsIndices[0];
                rePrint();
                return;
            }
            if (isAutocompleteActive()) {
                const autocompleteCompliantIndices = getAutocompleteCompliantIndices();
                if (autocompleteCompliantIndices.length <= CHOICES_ON_SCREEN) {
                    // just change the pointer
                    currentPointer = autocompleteCompliantIndices[0];
                    rePrint();
                    return;
                }
                // too many autocomplete compliant options => the visible range has to shift
                if (autocompleteCompliantIndices[autocompleteCompliantIndices.length - 1] === visibleOptionsIndices[visibleOptionsIndices.length - 1]) {
                    // overflow and shift the window to the top
                    visibleOptionsIndices = autocompleteCompliantIndices.slice(0, CHOICES_ON_SCREEN);
                    currentPointer = visibleOptionsIndices[0];
                }
                else {
                    // simple shift by one down
                    visibleOptionsIndices.shift();
                    const boundaryIndex = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[visibleOptionsIndices.length - 1]);
                    if (boundaryIndex === -1 || boundaryIndex >= autocompleteCompliantIndices.length - 1) {
                        visibleOptionsIndices.push(autocompleteCompliantIndices[0]);
                    }
                    else {
                        visibleOptionsIndices.push(autocompleteCompliantIndices[boundaryIndex + 1]);
                    }
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                }
            }
            else {
                // shift the range of visible +options+ indices
                if (visibleOptionsIndices[visibleOptionsIndices.length - 1] === options.length - 1) {
                    // overflow and shift the window to the top
                    visibleOptionsIndices = [...Array(CHOICES_ON_SCREEN).keys()];
                    currentPointer = 0;
                }
                else {
                    // simple shift by one down
                    visibleOptionsIndices.shift();
                    visibleOptionsIndices.push(visibleOptionsIndices[visibleOptionsIndices.length - 1] + 1);
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                }
            }
        }
        else {
            const index = visibleOptionsIndices.findIndex(i => i === currentPointer);
            currentPointer = visibleOptionsIndices[index + 1];
        }
        rePrint();
    };
    const enter = () => {
        if (invalidSelection) {
            return;
        }
        process.stdin.removeListener('data', dataHandler);
        process.stdin.setRawMode(false);
        if (!process.stdin.isPaused()) {
            process.stdin.pause();
        }
        process.stdout.moveCursor(0, autocomplete ? visibleOptionsIndices.length : visibleOptionsIndices.length - 1);
        showCursor();
        newline();
        emitter.emit('selection', options[currentPointer]);
    };
    const ctrlc = () => {
        process.stdout.moveCursor(0, visibleOptionsIndices.length);
        newline();
        write('EXIT..');
        newline();
        process.exit(0);
    };
    const rePrint = () => {
        let opts;
        if (invalidSelection) {
            opts = ['> no option matches the filter'];
        }
        else {
            opts = options.filter((_, i) => visibleOptionsIndices.includes(i)).map(o => `> ${colorizeOption(o)}`);
        }
        if (autocomplete) {
            newline();
        }
        opts.forEach((opt, i) => {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            if (visibleOptionsIndices[i] === currentPointer) {
                write(highlight(opts[i]));
            }
            else {
                write(opts[i]);
            }
            if (i !== opts.length - 1)
                newline();
        });
        process.stdout.clearScreenDown();
        const shiftUp = opts.length < CHOICES_ON_SCREEN ? opts.length : CHOICES_ON_SCREEN;
        process.stdout.moveCursor(0, -shiftUp + 1);
        if (autocomplete) {
            process.stdout.moveCursor(0, -1);
            process.stdout.cursorTo(AUTOCOMPLETE_LABEL.length + autoCompleteStringPointer);
        }
    };
    write(question);
    newline();
    autocomplete && write(AUTOCOMPLETE_LABEL);
    currentPointer = pointer ?? 0;
    if (currentPointer > CHOICES_ON_SCREEN) {
        currentPointer = CHOICES_ON_SCREEN;
    }
    const range = CHOICES_ON_SCREEN < options.length ? CHOICES_ON_SCREEN : options.length;
    visibleOptionsIndices = [...Array(range).keys()];
    rePrint();
    process.stdin.setRawMode(true);
    if (process.stdin.isPaused()) {
        process.stdin.resume();
    }
    process.stdin.setEncoding('utf-8');
    !autocomplete && hideCursor();
    process.stdin.on('data', dataHandler);
    return new Promise((resolve) => {
        emitter.on('selection', (selection) => resolve(selection));
    });
};
exports.select = select;
/**
 * Interactive input with validation
 */
const input = ({ question, invalidWarning, defaultValue, validationCallback = () => true }) => {
    const emitter = new node_events_1.EventEmitter();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const ask = () => {
        const qstn = defaultValue ? `${question} [${defaultValue}]` : question;
        rl.question(`${qstn}: `, (answer) => {
            const isDefaultAnswer = !!(defaultValue && answer === '');
            if (isDefaultAnswer) {
                emitter.emit('selection', defaultValue);
                rl.close();
                return;
            }
            if (validationCallback(answer)) {
                emitter.emit('selection', answer);
                rl.close();
            }
            else {
                console.log(invalidWarning || 'invalid answer');
                ask();
            }
        });
    };
    ask();
    return new Promise((resolve) => {
        emitter.on('selection', (selection) => resolve(selection));
    });
};
exports.input = input;
//# sourceMappingURL=cli.js.map