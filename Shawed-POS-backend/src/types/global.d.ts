// Global type declarations for Node.js
declare global {
  var process: NodeJS.Process;
  var console: Console;
}

// Import Node.js crypto module
declare module 'crypto' {
  export function randomBytes(size: number): Buffer;
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string | Buffer): any;
}

export {};
