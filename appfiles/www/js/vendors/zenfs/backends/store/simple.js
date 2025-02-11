import { SyncTransaction } from './store.js';
/**
 * An interface for simple asynchronous stores that don't have special support for transactions and such.
 * This class adds caching at the store level.
 */
export class SimpleAsyncStore {
    constructor() {
        this.cache = new Map();
        this.queue = new Set();
    }
    get(ino) {
        return this.cache.get(ino);
    }
    set(ino, data) {
        this.cache.set(ino, data);
        this.queue.add(this._set(ino, data));
    }
    delete(ino) {
        this.cache.delete(ino);
        this.queue.add(this._delete(ino));
    }
    clearSync() {
        this.cache.clear();
        this.queue.add(this.clear());
    }
    async sync() {
        for (const [ino, data] of await this.entries()) {
            if (!this.cache.has(ino)) {
                this.cache.set(ino, data);
            }
        }
        for (const promise of this.queue) {
            await promise;
        }
    }
    transaction() {
        return new SimpleTransaction(this);
    }
}
/**
 * Transaction for simple stores.
 * @see SimpleSyncStore
 * @see SimpleAsyncStore
 */
export class SimpleTransaction extends SyncTransaction {
    constructor(store) {
        super(store);
        /**
         * Stores data in the keys we modify prior to modifying them.
         * Allows us to roll back commits.
         */
        this.originalData = new Map();
        /**
         * List of keys modified in this transaction, if any.
         */
        this.modifiedKeys = new Set();
    }
    getSync(ino) {
        const val = this.store.get(ino);
        this.stashOldValue(ino, val);
        return val;
    }
    setSync(ino, data) {
        this.markModified(ino);
        return this.store.set(ino, data);
    }
    removeSync(ino) {
        this.markModified(ino);
        this.store.delete(ino);
    }
    commitSync() {
        this.done = true;
    }
    abortSync() {
        if (!this.done) {
            return;
        }
        // Rollback old values.
        for (const key of this.modifiedKeys) {
            const value = this.originalData.get(key);
            if (!value) {
                // Key didn't exist.
                this.store.delete(key);
            }
            else {
                // Key existed. Store old value.
                this.store.set(key, value);
            }
        }
        this.done = true;
    }
    /**
     * Stashes given key value pair into `originalData` if it doesn't already
     * exist. Allows us to stash values the program is requesting anyway to
     * prevent needless `get` requests if the program modifies the data later
     * on during the transaction.
     */
    stashOldValue(ino, value) {
        // Keep only the earliest value in the transaction.
        if (!this.originalData.has(ino)) {
            this.originalData.set(ino, value);
        }
    }
    /**
     * Marks the given key as modified, and stashes its value if it has not been
     * stashed already.
     */
    markModified(ino) {
        this.modifiedKeys.add(ino);
        if (!this.originalData.has(ino)) {
            this.originalData.set(ino, this.store.get(ino));
        }
    }
}
