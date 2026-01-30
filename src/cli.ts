import { EventEmitter } from 'node:events';
import * as readline from 'node:readline';
import { fuzzyFilter } from './fuzzy';
import { colorizeStatus } from './colors';
import type { SelectConfig, InputConfig } from './types';

// Helper function to colorize status in option text
function colorizeOption(option: string): string {
  const statusMatch = option.match(/(Running|Pending|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff|Terminated)/);
  if (statusMatch) {
    return option.replace(statusMatch[0], colorizeStatus(statusMatch[0]));
  }
  return option;
}

const ARROW_UP: string = '\x1B[A';
const ARROW_DOWN: string = '\x1B[B';
const ENTER: string = '\x0D';
const CTRLC: string = '\x03';
const DELETE: string = '\x1B[3~';
const BACKSPACE: string = '\b';
const BACKSPACE2: string = String.fromCharCode(127);
const ARROW_LEFT: string = '\x1B[D';
const ARROW_RIGHT: string = '\x1B[C';
const highlight = (str: string): string => `${makeBold(str)} <-`;
const write = (str: string): boolean => process.stdout.write(str);
const newline = (): boolean => write('\n');
const hideCursor = (): boolean => write('\x1B[?25l');
const showCursor = (): boolean => write('\x1B[?25h');
const makeBold = (str: string): string => `\x1b[1m${str}\x1b[22m`;
const CHOICES_ON_SCREEN: number = 5;
const AUTOCOMPLETE_LABEL: string = '>>> autocomplete: ';

/**
 * Interactive selection from options list
 */
export const select = ({ question, options, pointer, autocomplete }: SelectConfig): Promise<string> => {
    if (!options || options.length === 0) {
        console.log('No options available');
        return Promise.resolve('');
    }

    if (!process.stdin.isTTY) {
        throw new Error('process stdin is not tty (the script is run via child process probably..)');
    }

    const emitter: EventEmitter = new EventEmitter();
    let currentPointer: number;
    let visibleOptionsIndices: number[];
    let autocompleteString: string = '';
    let autoCompleteStringPointer: number = 0;
    let invalidSelection: boolean = false;

    function dataHandler(character: string): void {
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

    const isAutocompleteActive = (): boolean => !!(autocomplete && autocompleteString);

    const isRangeAlwaysVisible = (): boolean => options.length <= CHOICES_ON_SCREEN;

    const doAutoComplete = (): void => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        write(AUTOCOMPLETE_LABEL);
        write(autocompleteString);
        process.stdout.cursorTo(AUTOCOMPLETE_LABEL.length + autoCompleteStringPointer);

        const autocompleteCompliantIndices: number[] = getAutocompleteCompliantIndices();
        visibleOptionsIndices = autocompleteCompliantIndices.slice(0, CHOICES_ON_SCREEN);

        if (visibleOptionsIndices.length) {
            currentPointer = visibleOptionsIndices[0];
            invalidSelection = false;
        } else {
            currentPointer = -1;
            invalidSelection = true;
        }
        rePrint();
    };

    const getAutocompleteCompliantIndices = (): number[] => {
        const filtered = fuzzyFilter(options, autocompleteString);
        return filtered.map(f => f.originalIndex);
    };

    const autocompleteHandler = (character: string): void => {
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

    const up = (): void => {
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
                const autocompleteCompliantIndices: number[] = getAutocompleteCompliantIndices();
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
                    for (let i: number = CHOICES_ON_SCREEN - 1; i >= 0; i--) {
                        visibleOptionsIndices.push(autocompleteCompliantIndices[autocompleteCompliantIndices.length - i - 1]);
                    }
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                } else {
                    // simple shift by one up
                    visibleOptionsIndices.pop();
                    const boundaryIndex: number = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[0]);
                    if (boundaryIndex === -1 || boundaryIndex === 0) {
                        visibleOptionsIndices.unshift(autocompleteCompliantIndices[autocompleteCompliantIndices.length - 1]);
                    } else {
                        visibleOptionsIndices.unshift(autocompleteCompliantIndices[boundaryIndex - 1]);
                    }
                    currentPointer = visibleOptionsIndices[0];
                }
            } else {
                // shift the range of visible +options+ indices
                if (visibleOptionsIndices[0] === 0) {
                    // overflow and shift the window to the bottom
                    visibleOptionsIndices = [...Array(CHOICES_ON_SCREEN).keys()].map(i => i + options.length - CHOICES_ON_SCREEN);
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                } else {
                    // simple shift by one up
                    visibleOptionsIndices.pop();
                    visibleOptionsIndices.unshift(visibleOptionsIndices[0] - 1);
                    currentPointer = visibleOptionsIndices[0];
                }
            }
        } else {
            const index: number = visibleOptionsIndices.findIndex(i => i === currentPointer);
            currentPointer = visibleOptionsIndices[index - 1];
        }
        rePrint();
    };

    const down = (): void => {
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
                const autocompleteCompliantIndices: number[] = getAutocompleteCompliantIndices();
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
                } else {
                    // simple shift by one down
                    visibleOptionsIndices.shift();
                    const boundaryIndex: number = autocompleteCompliantIndices.findIndex(i => i === visibleOptionsIndices[visibleOptionsIndices.length - 1]);
                    if (boundaryIndex === -1 || boundaryIndex >= autocompleteCompliantIndices.length - 1) {
                        visibleOptionsIndices.push(autocompleteCompliantIndices[0]);
                    } else {
                        visibleOptionsIndices.push(autocompleteCompliantIndices[boundaryIndex + 1]);
                    }
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                }
            } else {
                // shift the range of visible +options+ indices
                if (visibleOptionsIndices[visibleOptionsIndices.length - 1] === options.length - 1) {
                    // overflow and shift the window to the top
                    visibleOptionsIndices = [...Array(CHOICES_ON_SCREEN).keys()];
                    currentPointer = 0;
                } else {
                    // simple shift by one down
                    visibleOptionsIndices.shift();
                    visibleOptionsIndices.push(visibleOptionsIndices[visibleOptionsIndices.length - 1] + 1);
                    currentPointer = visibleOptionsIndices[visibleOptionsIndices.length - 1];
                }

            }
        } else {
            const index: number = visibleOptionsIndices.findIndex(i => i === currentPointer);
            currentPointer = visibleOptionsIndices[index + 1];
        }
        rePrint();
    };

    const enter = (): void => {
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

    const ctrlc = (): void => {
        process.stdout.moveCursor(0, visibleOptionsIndices.length);
        newline();
        write('EXIT..');
        newline();
        process.exit(0);
    };

    const rePrint = (): void => {
        let opts: string[];
        if (invalidSelection) {
            opts = ['> no option matches the filter'];
        } else {
            // Map in order of visibleOptionsIndices to preserve fuzzy sort order
            opts = visibleOptionsIndices.map(i => `> ${colorizeOption(options[i])}`);
        }

        if (autocomplete) {
            newline();
        }

        opts.forEach((opt, i) => {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            if (visibleOptionsIndices[i] === currentPointer) {
                write(highlight(opt));
            } else {
                write(opt);
            }
            if (i !== opts.length - 1)
                newline();
        });

        process.stdout.clearScreenDown();
        const shiftUp: number = opts.length < CHOICES_ON_SCREEN ? opts.length : CHOICES_ON_SCREEN;
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
    const range: number = CHOICES_ON_SCREEN < options.length ? CHOICES_ON_SCREEN : options.length;
    visibleOptionsIndices = [...Array(range).keys()];
    rePrint();

    process.stdin.setRawMode(true);
    if (process.stdin.isPaused()) {
        process.stdin.resume();
    }
    process.stdin.setEncoding('utf-8');
    !autocomplete && hideCursor();
    process.stdin.on('data', dataHandler);
    return new Promise<string>((resolve) => {
        emitter.on('selection', (selection: string) => resolve(selection));
    });
};

/**
 * Interactive input with validation
 */
export const input = ({ question, invalidWarning, defaultValue, validationCallback = () => true }: InputConfig): Promise<string> => {
    const emitter: EventEmitter = new EventEmitter();
    const rl: readline.Interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const ask = (): void => {
        const qstn: string = defaultValue ? `${question} [${defaultValue}]` : question;
        rl.question(`${qstn}: `, (answer: string) => {
            const isDefaultAnswer: boolean = !!(defaultValue && answer === '');
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
};
