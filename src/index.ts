import identity from './client-version.json';
export const VERSION: string = identity.version;
export const IDENTITY = Object.freeze({ ...identity });
export * from './command-language';
export * from './diagnostics';
