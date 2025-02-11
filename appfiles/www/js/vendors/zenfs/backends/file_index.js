/* Note: this file is named file_index.ts because Typescript has special behavior regarding index.ts which can't be disabled. */
import { isJSON } from 'utilium';
import { basename, dirname } from '../emulation/path.js';
import { Errno, ErrnoError } from '../error.js';
import { NoSyncFile, isWriteable } from '../file.js';
import { FileSystem } from '../filesystem.js';
import { Readonly } from '../mixins/readonly.js';
import { Stats } from '../stats.js';
import { decode, encode } from '../utils.js';
export const version = 1;
/**
 * An index of files
 * @internal
 */
export class Index extends Map {
    /**
     * Convience method
     */
    files() {
        const files = new Map();
        for (const [path, stats] of this) {
            if (stats.isFile()) {
                files.set(path, stats);
            }
        }
        return files;
    }
    /**
     * Converts the index to JSON
     */
    toJSON() {
        return {
            version,
            entries: Object.fromEntries(this),
        };
    }
    /**
     * Converts the index to a string
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
    /**
     * Returns the files in the directory `dir`.
     * This is expensive so it is only called once per directory.
     */
    dirEntries(dir) {
        const entries = [];
        for (const entry of this.keys()) {
            if (dirname(entry) == dir) {
                entries.push(basename(entry));
            }
        }
        return entries;
    }
    /**
     * Loads the index from JSON data
     */
    fromJSON(json) {
        if (json.version != version) {
            throw new ErrnoError(Errno.EINVAL, 'Index version mismatch');
        }
        this.clear();
        for (const [path, data] of Object.entries(json.entries)) {
            const stats = new Stats(data);
            if (stats.isDirectory()) {
                stats.fileData = encode(JSON.stringify(this.dirEntries(path)));
            }
            this.set(path, stats);
        }
    }
    /**
     * Parses an index from a string
     */
    static parse(data) {
        if (!isJSON(data)) {
            throw new ErrnoError(Errno.EINVAL, 'Invalid JSON');
        }
        const json = JSON.parse(data);
        const index = new Index();
        index.fromJSON(json);
        return index;
    }
}
export class IndexFS extends Readonly(FileSystem) {
    async ready() {
        await super.ready();
        if (this._isInitialized) {
            return;
        }
        this.index.fromJSON(await this.indexData);
        this._isInitialized = true;
    }
    constructor(indexData) {
        super();
        this.indexData = indexData;
        this.index = new Index();
        this._isInitialized = false;
    }
    async reloadFiles() {
        for (const [path, stats] of this.index.files()) {
            delete stats.fileData;
            stats.fileData = await this.getData(path, stats);
        }
    }
    reloadFilesSync() {
        for (const [path, stats] of this.index.files()) {
            delete stats.fileData;
            stats.fileData = this.getDataSync(path, stats);
        }
    }
    stat(path) {
        return Promise.resolve(this.statSync(path));
    }
    statSync(path) {
        if (!this.index.has(path)) {
            throw ErrnoError.With('ENOENT', path, 'stat');
        }
        return this.index.get(path);
    }
    async openFile(path, flag) {
        if (isWriteable(flag)) {
            // You can't write to files on this file system.
            throw new ErrnoError(Errno.EPERM, path);
        }
        // Check if the path exists, and is a file.
        const stats = this.index.get(path);
        if (!stats) {
            throw ErrnoError.With('ENOENT', path, 'openFile');
        }
        return new NoSyncFile(this, path, flag, stats, stats.isDirectory() ? stats.fileData : await this.getData(path, stats));
    }
    openFileSync(path, flag) {
        if (isWriteable(flag)) {
            // You can't write to files on this file system.
            throw new ErrnoError(Errno.EPERM, path);
        }
        // Check if the path exists, and is a file.
        const stats = this.index.get(path);
        if (!stats) {
            throw ErrnoError.With('ENOENT', path, 'openFile');
        }
        return new NoSyncFile(this, path, flag, stats, stats.isDirectory() ? stats.fileData : this.getDataSync(path, stats));
    }
    readdir(path) {
        return Promise.resolve(this.readdirSync(path));
    }
    readdirSync(path) {
        // Check if it exists.
        const stats = this.index.get(path);
        if (!stats) {
            throw ErrnoError.With('ENOENT', path, 'readdir');
        }
        if (!stats.isDirectory()) {
            throw ErrnoError.With('ENOTDIR', path, 'readdir');
        }
        const content = JSON.parse(decode(stats.fileData));
        if (!Array.isArray(content)) {
            throw ErrnoError.With('ENODATA', path, 'readdir');
        }
        if (!content.every(item => typeof item == 'string')) {
            throw ErrnoError.With('ENODATA', path, 'readdir');
        }
        return content;
    }
}
