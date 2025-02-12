import { type File } from '../file.js';
import type { FileSystem } from '../filesystem.js';
import type { Stats } from '../stats.js';
import type { _AsyncFSMethods, Mixin } from './shared.js';
/**
 * @internal
 */
export type AsyncOperation = {
    [K in keyof _AsyncFSMethods]: [K, ...Parameters<FileSystem[K]>];
}[keyof _AsyncFSMethods];
/**
 * Async() implements synchronous methods on an asynchronous file system
 *
 * Implementing classes must define `_sync` for the synchronous file system used as a cache.
 *
 * Synchronous methods on an asynchronous FS are implemented by performing operations over the in-memory copy,
 * while asynchronously pipelining them to the backing store.
 * During loading, the contents of the async file system are preloaded into the synchronous store.
 *
 */
export declare function Async<T extends typeof FileSystem>(FS: T): Mixin<T, {
    /**
     * @internal @protected
     */
    _sync?: FileSystem;
    queueDone(): Promise<void>;
    ready(): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    statSync(path: string): Stats;
    createFileSync(path: string, flag: string, mode: number): File;
    openFileSync(path: string, flag: string): File;
    unlinkSync(path: string): void;
    rmdirSync(path: string): void;
    mkdirSync(path: string, mode: number): void;
    readdirSync(path: string): string[];
    linkSync(srcpath: string, dstpath: string): void;
    syncSync(path: string, data: Uint8Array, stats: Readonly<Stats>): void;
}>;
