import { PreloadFile } from '../../file.js';
import { FileSystem, type FileSystemMetadata } from '../../filesystem.js';
import { type Ino, Inode } from '../../inode.js';
import type { FileType, Stats } from '../../stats.js';
import type { Store, Transaction } from './store.js';
/**
 * A file system which uses a key-value store.
 *
 * We use a unique ID for each node in the file system. The root node has a fixed ID.
 * @todo Introduce Node ID caching.
 * @todo Check modes.
 * @internal
 */
export declare class StoreFS<T extends Store = Store> extends FileSystem {
    protected store: T;
    private _initialized;
    ready(): Promise<void>;
    constructor(store: T);
    metadata(): FileSystemMetadata;
    /**
     * Delete all contents stored in the file system.
     * @deprecated
     */
    empty(): Promise<void>;
    /**
     * Delete all contents stored in the file system.
     * @deprecated
     */
    emptySync(): void;
    /**
     * @todo Make rename compatible with the cache.
     */
    rename(oldPath: string, newPath: string): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    stat(path: string): Promise<Stats>;
    statSync(path: string): Stats;
    createFile(path: string, flag: string, mode: number): Promise<PreloadFile<this>>;
    createFileSync(path: string, flag: string, mode: number): PreloadFile<this>;
    openFile(path: string, flag: string): Promise<PreloadFile<this>>;
    openFileSync(path: string, flag: string): PreloadFile<this>;
    unlink(path: string): Promise<void>;
    unlinkSync(path: string): void;
    rmdir(path: string): Promise<void>;
    rmdirSync(path: string): void;
    mkdir(path: string, mode: number): Promise<void>;
    mkdirSync(path: string, mode: number): void;
    readdir(path: string): Promise<string[]>;
    readdirSync(path: string): string[];
    /**
     * Updated the inode and data node at the given path
     * @todo Ensure mtime updates properly, and use that to determine if a data update is required.
     */
    sync(path: string, data: Uint8Array, stats: Readonly<Stats>): Promise<void>;
    /**
     * Updated the inode and data node at the given path
     * @todo Ensure mtime updates properly, and use that to determine if a data update is required.
     */
    syncSync(path: string, data: Uint8Array, stats: Readonly<Stats>): void;
    link(target: string, link: string): Promise<void>;
    linkSync(target: string, link: string): void;
    /**
     * Checks if the root directory exists. Creates it if it doesn't.
     */
    checkRoot(): Promise<void>;
    /**
     * Checks if the root directory exists. Creates it if it doesn't.
     */
    checkRootSync(): void;
    /**
     * Helper function for findINode.
     * @param parent The parent directory of the file we are attempting to find.
     * @param filename The filename of the inode we are attempting to find, minus
     *   the parent.
     */
    private _findINode;
    /**
     * Helper function for findINode.
     * @param parent The parent directory of the file we are attempting to find.
     * @param filename The filename of the inode we are attempting to find, minus
     *   the parent.
     * @return string The ID of the file's inode in the file system.
     */
    protected _findINodeSync(tx: Transaction, parent: string, filename: string, visited?: Set<string>): Ino;
    /**
     * Finds the Inode of the given path.
     * @param path The path to look up.
     * @todo memoize/cache
     */
    private findINode;
    /**
     * Finds the Inode of the given path.
     * @param path The path to look up.
     * @return The Inode of the path p.
     * @todo memoize/cache
     */
    protected findINodeSync(tx: Transaction, path: string, visited?: Set<string>): Inode;
    /**
     * Given the ID of a node, retrieves the corresponding Inode.
     * @param tx The transaction to use.
     * @param path The corresponding path to the file (used for error messages).
     * @param id The ID to look up.
     */
    private getINode;
    /**
     * Given the ID of a node, retrieves the corresponding Inode.
     * @param tx The transaction to use.
     * @param path The corresponding path to the file (used for error messages).
     * @param id The ID to look up.
     */
    protected getINodeSync(tx: Transaction, id: Ino, path: string): Inode;
    /**
     * Given the Inode of a directory, retrieves the corresponding directory
     * listing.
     */
    private getDirListing;
    /**
     * Given the Inode of a directory, retrieves the corresponding directory listing.
     */
    protected getDirListingSync(tx: Transaction, inode: Inode, p?: string): {
        [fileName: string]: Ino;
    };
    /**
     * Adds a new node under a random ID. Retries before giving up in
     * the exceedingly unlikely chance that we try to reuse a random ino.
     */
    private addNew;
    /**
     * Creates a new node under a random ID. Retries before giving up in
     * the exceedingly unlikely chance that we try to reuse a random ino.
     * @return The ino that the data was stored under.
     */
    protected addNewSync(tx: Transaction, data: Uint8Array, path: string): Ino;
    /**
     * Commits a new file (well, a FILE or a DIRECTORY) to the file system with
     * the given mode.
     * Note: This will commit the transaction.
     * @param path The path to the new file.
     * @param type The type of the new file.
     * @param mode The mode to create the new file with.
     * @param cred The UID/GID to create the file with
     * @param data The data to store at the file's data node.
     */
    private commitNew;
    /**
     * Commits a new file (well, a FILE or a DIRECTORY) to the file system with the given mode.
     * Note: This will commit the transaction.
     * @param path The path to the new file.
     * @param type The type of the new file.
     * @param mode The mode to create the new file with.
     * @param data The data to store at the file's data node.
     * @return The Inode for the new file.
     */
    protected commitNewSync(path: string, type: FileType, mode: number, data?: Uint8Array): Inode;
    /**
     * Remove all traces of the given path from the file system.
     * @param path The path to remove from the file system.
     * @param isDir Does the path belong to a directory, or a file?
     * @todo Update mtime.
     */
    private remove;
    /**
     * Remove all traces of the given path from the file system.
     * @param path The path to remove from the file system.
     * @param isDir Does the path belong to a directory, or a file?
     * @todo Update mtime.
     */
    protected removeSync(path: string, isDir: boolean): void;
}
