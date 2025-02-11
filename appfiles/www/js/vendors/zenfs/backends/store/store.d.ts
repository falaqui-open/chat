import type { Ino } from '../../inode.js';
import '../../polyfills.js';
/**
 * Represents a key-value store.
 */
export interface Store {
    /**
     * The name of the store.
     */
    readonly name: string;
    /**
     * Syncs the store
     */
    sync(): Promise<void>;
    /**
     * Empties the store completely.
     */
    clear(): Promise<void> | void;
    /**
     * Empties the store completely.
     */
    clearSync(): void;
    /**
     * Begins a new transaction.
     */
    transaction(): Transaction;
}
/**
 * A transaction for a store.
 */
export declare abstract class Transaction<T extends Store = Store> {
    protected store: T;
    constructor(store: T);
    /**
     * Whether the transaction was commited or aborted
     */
    protected done: boolean;
    /**
     * Retrieves the data at the given key.
     * @param ino The key to look under for data.
     */
    abstract get(ino: Ino): Promise<Uint8Array>;
    /**
     * Retrieves the data at the given key. Throws an error if an error occurs
     * or if the key does not exist.
     * @param ino The key to look under for data.
     * @return The data stored under the key, or undefined if not present.
     */
    abstract getSync(ino: Ino): Uint8Array;
    /**
     * Adds the data to the store under the given key. Overwrites any existing
     * data.
     * @param ino The key to add the data under.
     * @param data The data to add to the store.
     * @param overwrite If 'true', overwrite any existing data. If 'false',
     *   avoids writing the data if the key exists.
     */
    abstract set(ino: Ino, data: Uint8Array): Promise<void>;
    /**
     * Adds the data to the store under the given key.
     * @param ino The key to add the data under.
     * @param data The data to add to the store.
     * @param overwrite If 'true', overwrite any existing data. If 'false',
     *   avoids storing the data if the key exists.
     * @return True if storage succeeded, false otherwise.
     */
    abstract setSync(ino: Ino, data: Uint8Array): void;
    /**
     * Deletes the data at the given key.
     * @param ino The key to delete from the store.
     */
    abstract remove(ino: Ino): Promise<void>;
    /**
     * Deletes the data at the given key.
     * @param ino The key to delete from the store.
     */
    abstract removeSync(ino: Ino): void;
    /**
     * Commits the transaction.
     */
    abstract commit(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    /**
     * Commits the transaction.
     */
    abstract commitSync(): void;
    [Symbol.dispose](): void;
    /**
     * Aborts and rolls back the transaction.
     */
    abstract abort(): Promise<void>;
    /**
     * Aborts and rolls back the transaction.
     */
    abstract abortSync(): void;
}
/**
 * Transaction that implements asynchronous operations with synchronous ones
 */
export declare abstract class SyncTransaction<T extends Store = Store> extends Transaction<T> {
    get(ino: Ino): Promise<Uint8Array>;
    set(ino: bigint, data: Uint8Array): Promise<void>;
    remove(ino: Ino): Promise<void>;
    commit(): Promise<void>;
    abort(): Promise<void>;
}
/**
 * Transaction that only supports asynchronous operations
 */
export declare abstract class AsyncTransaction<T extends Store = Store> extends Transaction<T> {
    getSync(): Uint8Array;
    setSync(): void;
    removeSync(): void;
    commitSync(): void;
    abortSync(): void;
}
