import type { Ino } from '../inode.js';
import { StoreFS } from './store/fs.js';
import { SimpleTransaction, type SimpleSyncStore } from './store/simple.js';
/**
 * A simple in-memory store
 */
export declare class InMemoryStore extends Map<Ino, Uint8Array> implements SimpleSyncStore {
    name: string;
    constructor(name?: string);
    sync(): Promise<void>;
    clearSync(): void;
    transaction(): SimpleTransaction;
}
/**
 * A simple in-memory file system backed by an InMemoryStore.
 * Files are not persisted across page loads.
 */
export declare const _InMemory: {
    readonly name: "InMemory";
    readonly isAvailable: () => boolean;
    readonly options: {
        readonly name: {
            readonly type: "string";
            readonly required: false;
            readonly description: "The name of the store";
        };
    };
    readonly create: ({ name }: {
        name?: string;
    }) => StoreFS<InMemoryStore>;
};
type _inmemory = typeof _InMemory;
interface InMemory extends _inmemory {
}
export declare const InMemory: InMemory;
export {};
