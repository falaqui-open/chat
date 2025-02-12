import type { Ino } from '../../inode.js';
import { SyncTransaction, type Store } from './store.js';
/**
 * An interface for simple synchronous stores that don't have special support for transactions and such.
 */
export interface SimpleSyncStore extends Store {
    get(ino: Ino): Uint8Array | undefined;
    set(ino: Ino, data: Uint8Array): void;
    delete(ino: Ino): void;
}
/**
 * An interface for simple asynchronous stores that don't have special support for transactions and such.
 * This class adds caching at the store level.
 */
export declare abstract class SimpleAsyncStore implements SimpleSyncStore {
    abstract name: string;
    protected cache: Map<Ino, Uint8Array>;
    protected queue: Set<Promise<unknown>>;
    protected abstract entries(): Promise<Iterable<[Ino, Uint8Array]>>;
    get(ino: Ino): Uint8Array | undefined;
    set(ino: Ino, data: Uint8Array): void;
    protected abstract _set(ino: Ino, data: Uint8Array): Promise<void>;
    delete(ino: Ino): void;
    protected abstract _delete(ino: Ino): Promise<void>;
    clearSync(): void;
    abstract clear(): Promise<void>;
    sync(): Promise<void>;
    transaction(): SimpleTransaction;
}
/**
 * Transaction for simple stores.
 * @see SimpleSyncStore
 * @see SimpleAsyncStore
 */
export declare class SimpleTransaction extends SyncTransaction<SimpleSyncStore> {
    /**
     * Stores data in the keys we modify prior to modifying them.
     * Allows us to roll back commits.
     */
    protected originalData: Map<Ino, Uint8Array | void>;
    /**
     * List of keys modified in this transaction, if any.
     */
    protected modifiedKeys: Set<Ino>;
    protected store: SimpleSyncStore;
    constructor(store: SimpleSyncStore);
    getSync(ino: Ino): Uint8Array;
    setSync(ino: Ino, data: Uint8Array): void;
    removeSync(ino: Ino): void;
    commitSync(): void;
    abortSync(): void;
    /**
     * Stashes given key value pair into `originalData` if it doesn't already
     * exist. Allows us to stash values the program is requesting anyway to
     * prevent needless `get` requests if the program modifies the data later
     * on during the transaction.
     */
    protected stashOldValue(ino: Ino, value?: Uint8Array): void;
    /**
     * Marks the given key as modified, and stashes its value if it has not been
     * stashed already.
     */
    protected markModified(ino: Ino): void;
}
