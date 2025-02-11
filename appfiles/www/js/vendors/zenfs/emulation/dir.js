import { Errno, ErrnoError } from '../error.js';
import { basename } from './path.js';
import { readdir } from './promises.js';
import { readdirSync } from './sync.js';
export class Dirent {
    get name() {
        return basename(this.path);
    }
    constructor(path, stats) {
        this.path = path;
        this.stats = stats;
    }
    get parentPath() {
        return this.path;
    }
    isFile() {
        return this.stats.isFile();
    }
    isDirectory() {
        return this.stats.isDirectory();
    }
    isBlockDevice() {
        return this.stats.isBlockDevice();
    }
    isCharacterDevice() {
        return this.stats.isCharacterDevice();
    }
    isSymbolicLink() {
        return this.stats.isSymbolicLink();
    }
    isFIFO() {
        return this.stats.isFIFO();
    }
    isSocket() {
        return this.stats.isSocket();
    }
}
/**
 * A class representing a directory stream.
 */
export class Dir {
    checkClosed() {
        if (this.closed) {
            throw new ErrnoError(Errno.EBADF, 'Can not use closed Dir');
        }
    }
    constructor(path) {
        this.path = path;
        this.closed = false;
    }
    close(cb) {
        this.closed = true;
        if (!cb) {
            return Promise.resolve();
        }
        cb();
    }
    /**
     * Synchronously close the directory's underlying resource handle.
     * Subsequent reads will result in errors.
     */
    closeSync() {
        this.closed = true;
    }
    async _read() {
        this.checkClosed();
        this._entries ?? (this._entries = await readdir(this.path, { withFileTypes: true }));
        if (!this._entries.length) {
            return null;
        }
        return this._entries.shift() ?? null;
    }
    read(cb) {
        if (!cb) {
            return this._read();
        }
        void this._read().then(value => cb(undefined, value));
    }
    /**
     * Synchronously read the next directory entry via `readdir(3)` as a `Dirent`.
     * If there are no more directory entries to read, null will be returned.
     * Directory entries returned by this function are in no particular order as provided by the operating system's underlying directory mechanisms.
     */
    readSync() {
        this.checkClosed();
        this._entries ?? (this._entries = readdirSync(this.path, { withFileTypes: true }));
        if (!this._entries.length) {
            return null;
        }
        return this._entries.shift() ?? null;
    }
    async next() {
        const value = await this._read();
        if (value) {
            return { done: false, value };
        }
        await this.close();
        return { done: true, value: undefined };
    }
    /**
     * Asynchronously iterates over the directory via `readdir(3)` until all entries have been read.
     */
    [Symbol.asyncIterator]() {
        return this;
    }
}
