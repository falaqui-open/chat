import { StoreFS } from './store/fs.js';
import { SimpleTransaction } from './store/simple.js';
/**
 * A simple in-memory store
 */
export class InMemoryStore extends Map {
    constructor(name = 'tmp') {
        super();
        this.name = name;
    }
    async sync() { }
    clearSync() {
        this.clear();
    }
    transaction() {
        return new SimpleTransaction(this);
    }
}
/**
 * A simple in-memory file system backed by an InMemoryStore.
 * Files are not persisted across page loads.
 */
export const _InMemory = {
    name: 'InMemory',
    isAvailable() {
        return true;
    },
    options: {
        name: {
            type: 'string',
            required: false,
            description: 'The name of the store',
        },
    },
    create({ name }) {
        const fs = new StoreFS(new InMemoryStore(name));
        fs.checkRootSync();
        return fs;
    },
};
export const InMemory = _InMemory;
