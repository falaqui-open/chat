import { ZenFsType } from './stats.js';
/**
 * Structure for a filesystem. All ZenFS backends must extend this.
 *
 * This class includes default implementations for `exists` and `existsSync`
 *
 * If you are extending this class, note that every path is an absolute path and all arguments are present.
 */
export class FileSystem {
    /**
     * Get metadata about the current file system
     */
    metadata() {
        return {
            name: this.constructor.name.toLowerCase(),
            readonly: false,
            totalSpace: 0,
            freeSpace: 0,
            noResizableBuffers: false,
            noAsyncCache: this._disableSync ?? false,
            type: ZenFsType,
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(...args) { }
    async ready() { }
    /**
     * Test whether or not the given path exists.
     */
    async exists(path) {
        try {
            await this.stat(path);
            return true;
        }
        catch (e) {
            return e.code != 'ENOENT';
        }
    }
    /**
     * Test whether or not the given path exists.
     */
    existsSync(path) {
        try {
            this.statSync(path);
            return true;
        }
        catch (e) {
            return e.code != 'ENOENT';
        }
    }
}
