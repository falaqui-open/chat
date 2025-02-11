/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import type * as fs from 'node:fs';
import type { OptionalTuple } from 'utilium';
import { type AbsolutePath } from './emulation/path.js';
import { ErrnoError } from './error.js';
import type { FileSystem } from './filesystem.js';
declare global {
    function atob(data: string): string;
    function btoa(data: string): string;
}
/**
 * Synchronous recursive makedir.
 * @hidden
 */
export declare function mkdirpSync(path: string, mode: number, fs: FileSystem): void;
/**
 * Calculates levenshtein distance.
 * @hidden
 */
export declare function levenshtein(a: string, b: string): number;
/**
 * @hidden
 */
export declare const setImmediate: (callback: () => unknown) => void;
/**
 * Encodes a string into a buffer
 * @internal
 */
export declare function encode(input: string): Uint8Array;
/**
 * Decodes a string from a buffer
 * @internal
 */
export declare function decode(input?: Uint8Array): string;
/**
 * Decodes a directory listing
 * @hidden
 */
export declare function decodeDirListing(data: Uint8Array): Record<string, bigint>;
/**
 * Encodes a directory listing
 * @hidden
 */
export declare function encodeDirListing(data: Record<string, bigint>): Uint8Array;
export type Callback<Args extends unknown[] = []> = (e?: ErrnoError, ...args: OptionalTuple<Args>) => unknown;
/**
 * converts Date or number to a integer UNIX timestamp
 * Grabbed from NodeJS sources (lib/fs.js)
 *
 * @internal
 */
export declare function _toUnixTimestamp(time: Date | number): number;
/**
 * Normalizes a mode
 * @internal
 */
export declare function normalizeMode(mode: unknown, def?: number): number;
/**
 * Normalizes a time
 * @internal
 */
export declare function normalizeTime(time: string | number | Date): Date;
/**
 * Normalizes a path
 * @internal
 */
export declare function normalizePath(p: fs.PathLike): AbsolutePath;
/**
 * Normalizes options
 * @param options options to normalize
 * @param encoding default encoding
 * @param flag default flag
 * @param mode default mode
 * @internal
 */
export declare function normalizeOptions(options: fs.WriteFileOptions | (fs.EncodingOption & {
    flag?: fs.OpenMode;
}) | undefined, encoding: BufferEncoding | null | undefined, flag: string, mode?: number): {
    encoding?: BufferEncoding | null;
    flag: string;
    mode: number;
};
