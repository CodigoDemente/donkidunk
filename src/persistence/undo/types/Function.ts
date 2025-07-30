export type FunctionOrPromise = (...args: never[]) => Promise<unknown> | unknown | void;
