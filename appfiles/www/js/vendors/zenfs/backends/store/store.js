import { ErrnoError } from '../../error.js';
import '../../polyfills.js';
/**
 * A transaction for a store.
 */
export class Transaction {
    constructor(store) {
        this.store = store;
        /**
         * Whether the transaction was commited or aborted
         */
        this.done = false;
    }
    async [Symbol.asyncDispose]() {
        if (this.done) {
            return;
        }
        await this.abort();
    }
    [Symbol.dispose]() {
        if (this.done) {
            return;
        }
        this.abortSync();
    }
}
/**
 * Transaction that implements asynchronous operations with synchronous ones
 */
export class SyncTransaction extends Transaction {
    /* eslint-disable @typescript-eslint/require-await */
    async get(ino) {
        return this.getSync(ino);
    }
    async set(ino, data) {
        return this.setSync(ino, data);
    }
    async remove(ino) {
        return this.removeSync(ino);
    }
    async commit() {
        return this.commitSync();
    }
    async abort() {
        return this.abortSync();
    }
}
/**
 * Transaction that only supports asynchronous operations
 */
export class AsyncTransaction extends Transaction {
    getSync() {
        throw ErrnoError.With('ENOSYS', undefined, 'AsyncTransaction.getSync');
    }
    setSync() {
        throw ErrnoError.With('ENOSYS', undefined, 'AsyncTransaction.setSync');
    }
    removeSync() {
        throw ErrnoError.With('ENOSYS', undefined, 'AsyncTransaction.removeSync');
    }
    commitSync() {
        throw ErrnoError.With('ENOSYS', undefined, 'AsyncTransaction.commitSync');
    }
    abortSync() {
        throw ErrnoError.With('ENOSYS', undefined, 'AsyncTransaction.abortSync');
    }
}
