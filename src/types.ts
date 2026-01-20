// src/types.ts

export interface Pod {
  name: string;
  namespace: string;
}

export interface Service {
  name: string;
  namespace: string;
}

export type ResourceType = 'pod' | 'service';

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
