import type { File } from '../file.js';
import type { FileSystem, FileSystemMetadata } from '../filesystem.js';
import type { Stats } from '../stats.js';
import type { Mixin } from './shared.js';
/**
 * Implements the non-readonly methods to throw `EROFS`
 */
export declare function Readonly<T extends typeof FileSystem>(FS: T): Mixin<T, {
    metadata(): FileSystemMetadata;
    rename(oldPath: string, newPath: string): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    createFile(path: string, flag: string, mode: number): Promise<File>;
    createFileSync(path: string, flag: string, mode: number): File;
    unlink(path: string): Promise<void>;
    unlinkSync(path: string): void;
    rmdir(path: string): Promise<void>;
    rmdirSync(path: string): void;
    mkdir(path: string, mode: number): Promise<void>;
    mkdirSync(path: string, mode: number): void;
    link(srcpath: string, dstpath: string): Promise<void>;
    linkSync(srcpath: string, dstpath: string): void;
    sync(path: string, data: Uint8Array, stats: Readonly<Stats>): Promise<void>;
    syncSync(path: string, data: Uint8Array, stats: Readonly<Stats>): void;
}>;
