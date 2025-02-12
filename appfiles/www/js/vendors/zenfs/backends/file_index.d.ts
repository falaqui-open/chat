import { NoSyncFile } from '../file.js';
import { FileSystem } from '../filesystem.js';
import type { StatsLike } from '../stats.js';
import { Stats } from '../stats.js';
/**
 * An Index in JSON form
 * @internal
 */
export interface IndexData {
    version: 1;
    entries: Record<string, StatsLike<number>>;
}
export declare const version = 1;
/**
 * An index of files
 * @internal
 */
export declare class Index extends Map<string, Stats> {
    /**
     * Convience method
     */
    files(): Map<string, Stats>;
    /**
     * Converts the index to JSON
     */
    toJSON(): IndexData;
    /**
     * Converts the index to a string
     */
    toString(): string;
    /**
     * Returns the files in the directory `dir`.
     * This is expensive so it is only called once per directory.
     */
    protected dirEntries(dir: string): string[];
    /**
     * Loads the index from JSON data
     */
    fromJSON(json: IndexData): void;
    /**
     * Parses an index from a string
     */
    static parse(data: string): Index;
}
declare const IndexFS_base: import("../mixins/shared.js").Mixin<typeof FileSystem, {
    metadata(): import("../filesystem.js").FileSystemMetadata;
    rename(oldPath: string, newPath: string): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    createFile(path: string, flag: string, mode: number): Promise<import("../file.js").File>;
    createFileSync(path: string, flag: string, mode: number): import("../file.js").File;
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
export declare abstract class IndexFS extends IndexFS_base {
    private indexData;
    protected index: Index;
    protected _isInitialized: boolean;
    ready(): Promise<void>;
    constructor(indexData: IndexData | Promise<IndexData>);
    reloadFiles(): Promise<void>;
    reloadFilesSync(): void;
    stat(path: string): Promise<Stats>;
    statSync(path: string): Stats;
    openFile(path: string, flag: string): Promise<NoSyncFile<this>>;
    openFileSync(path: string, flag: string): NoSyncFile<this>;
    readdir(path: string): Promise<string[]>;
    readdirSync(path: string): string[];
    protected abstract getData(path: string, stats: Stats): Promise<Uint8Array>;
    protected abstract getDataSync(path: string, stats: Stats): Uint8Array;
}
export {};
