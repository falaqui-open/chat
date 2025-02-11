import type { File } from '../file.js';
import type { FileSystemMetadata } from '../filesystem.js';
import { FileSystem } from '../filesystem.js';
import { Stats } from '../stats.js';
/**
 * Configuration options for OverlayFS instances.
 */
export interface OverlayOptions {
    /**
     * The file system to write modified files to.
     */
    writable: FileSystem;
    /**
     * The file system that initially populates this file system.
     */
    readable: FileSystem;
}
/**
 * OverlayFS makes a read-only filesystem writable by storing writes on a second, writable file system.
 * Deletes are persisted via metadata stored on the writable file system.
 *
 * This class contains no locking whatsoever. It is mutexed to prevent races.
 *
 * @internal
 */
export declare class UnmutexedOverlayFS extends FileSystem {
    ready(): Promise<void>;
    readonly writable: FileSystem;
    readonly readable: FileSystem;
    private _isInitialized;
    private _deletedFiles;
    private _deleteLog;
    private _deleteLogUpdatePending;
    private _deleteLogUpdateNeeded;
    private _deleteLogError?;
    private _ready;
    constructor({ writable, readable }: OverlayOptions);
    metadata(): FileSystemMetadata;
    sync(path: string, data: Uint8Array, stats: Readonly<Stats>): Promise<void>;
    syncSync(path: string, data: Uint8Array, stats: Readonly<Stats>): void;
    /**
     * Called once to load up metadata stored on the writable file system.
     * @internal
     */
    _initialize(): Promise<void>;
    getDeletionLog(): string;
    restoreDeletionLog(log: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    stat(path: string): Promise<Stats>;
    statSync(path: string): Stats;
    openFile(path: string, flag: string): Promise<File>;
    openFileSync(path: string, flag: string): File;
    createFile(path: string, flag: string, mode: number): Promise<File>;
    createFileSync(path: string, flag: string, mode: number): File;
    link(srcpath: string, dstpath: string): Promise<void>;
    linkSync(srcpath: string, dstpath: string): void;
    unlink(path: string): Promise<void>;
    unlinkSync(path: string): void;
    rmdir(path: string): Promise<void>;
    rmdirSync(path: string): void;
    mkdir(path: string, mode: number): Promise<void>;
    mkdirSync(path: string, mode: number): void;
    readdir(path: string): Promise<string[]>;
    readdirSync(path: string): string[];
    private deletePath;
    private updateLog;
    private _reparseDeletionLog;
    private checkInitialized;
    private checkPath;
    /**
     * With the given path, create the needed parent directories on the writable storage
     * should they not exist. Use modes from the read-only storage.
     */
    private createParentDirectoriesSync;
    private createParentDirectories;
    /**
     * Helper function:
     * - Ensures p is on writable before proceeding. Throws an error if it doesn't exist.
     * - Calls f to perform operation on writable.
     */
    private operateOnWritable;
    private operateOnWritableAsync;
    /**
     * Copy from readable to writable storage.
     * PRECONDITION: File does not exist on writable storage.
     */
    private copyToWritableSync;
    private copyToWritable;
}
declare const OverlayFS_base: import("../mixins/shared.js").Mixin<typeof UnmutexedOverlayFS, {
    lock(path: string, syscall: string): Promise<import("../mixins/mutexed.js").MutexLock>;
    lockSync(path: string): import("../mixins/mutexed.js").MutexLock;
    isLocked(path: string): boolean;
}>;
/**
 * OverlayFS makes a read-only filesystem writable by storing writes on a second,
 * writable file system. Deletes are persisted via metadata stored on the writable
 * file system.
 * @internal
 */
export declare class OverlayFS extends OverlayFS_base {
}
declare const _Overlay: {
    readonly name: "Overlay";
    readonly options: {
        readonly writable: {
            readonly type: "object";
            readonly required: true;
            readonly description: "The file system to write modified files to.";
        };
        readonly readable: {
            readonly type: "object";
            readonly required: true;
            readonly description: "The file system that initially populates this file system.";
        };
    };
    readonly isAvailable: () => boolean;
    readonly create: (options: OverlayOptions) => OverlayFS;
};
type _overlay = typeof _Overlay;
interface Overlay extends _overlay {
}
export declare const Overlay: Overlay;
export {};
