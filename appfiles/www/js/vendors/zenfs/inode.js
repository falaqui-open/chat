import { Stats } from './stats.js';
/**
 * Max 32-bit integer
 * @hidden
 */
export const size_max = 2 ** 32 - 1;
/**
 * Room inode
 * @hidden
 */
export const rootIno = 0n;
/**
 * Generates a random 32 bit integer, then converts to a hex string
 */
function _random() {
    return Math.round(Math.random() * 2 ** 32).toString(16);
}
/**
 * Generate a random ino
 * @internal
 */
export function randomIno() {
    return BigInt('0x' + _random() + _random());
}
/**
 * Offsets for inode members
 */
const offsets = {
    ino: 0,
    size: 8,
    mode: 12,
    nlink: 14,
    uid: 18,
    gid: 22,
    atime: 26,
    birthtime: 34,
    mtime: 42,
    ctime: 50,
    end: 58,
};
/**
 *  Offsets for a 64-bit inode's members
 * Currently unused
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const offsets_64 = {
    ino: 0,
    size: 8,
    mode: 16,
    nlink: 18,
    uid: 22,
    gid: 26,
    atime: 30,
    birthtime: 38,
    mtime: 46,
    ctime: 54,
    end: 62,
};
/**
 * Generic inode definition that can easily be serialized.
 */
export class Inode {
    get data() {
        return new Uint8Array(this.buffer);
    }
    constructor(buffer) {
        const setDefaults = !buffer;
        buffer ?? (buffer = new ArrayBuffer(offsets.end));
        if (buffer?.byteLength < offsets.end) {
            throw new RangeError(`Can not create an inode from a buffer less than ${offsets.end} bytes`);
        }
        this.view = new DataView(buffer);
        this.buffer = buffer;
        if (!setDefaults) {
            return;
        }
        // set defaults on a fresh inode
        this.ino = randomIno();
        this.nlink = 1;
        this.size = 4096;
        const now = Date.now();
        this.atimeMs = now;
        this.mtimeMs = now;
        this.ctimeMs = now;
        this.birthtimeMs = now;
    }
    get ino() {
        return this.view.getBigUint64(offsets.ino, true);
    }
    set ino(value) {
        this.view.setBigUint64(offsets.ino, value, true);
    }
    get size() {
        return this.view.getUint32(offsets.size, true);
    }
    set size(value) {
        this.view.setUint32(offsets.size, value, true);
    }
    get mode() {
        return this.view.getUint16(offsets.mode, true);
    }
    set mode(value) {
        this.view.setUint16(offsets.mode, value, true);
    }
    get nlink() {
        return this.view.getUint32(offsets.nlink, true);
    }
    set nlink(value) {
        this.view.setUint32(offsets.nlink, value, true);
    }
    get uid() {
        return this.view.getUint32(offsets.uid, true);
    }
    set uid(value) {
        this.view.setUint32(offsets.uid, value, true);
    }
    get gid() {
        return this.view.getUint32(offsets.gid, true);
    }
    set gid(value) {
        this.view.setUint32(offsets.gid, value, true);
    }
    get atimeMs() {
        return this.view.getFloat64(offsets.atime, true);
    }
    set atimeMs(value) {
        this.view.setFloat64(offsets.atime, value, true);
    }
    get birthtimeMs() {
        return this.view.getFloat64(offsets.birthtime, true);
    }
    set birthtimeMs(value) {
        this.view.setFloat64(offsets.birthtime, value, true);
    }
    get mtimeMs() {
        return this.view.getFloat64(offsets.mtime, true);
    }
    set mtimeMs(value) {
        this.view.setFloat64(offsets.mtime, value, true);
    }
    get ctimeMs() {
        return this.view.getFloat64(offsets.ctime, true);
    }
    set ctimeMs(value) {
        this.view.setFloat64(offsets.ctime, value, true);
    }
    /**
     * Handy function that converts the Inode to a Node Stats object.
     */
    toStats() {
        return new Stats(this);
    }
    /**
     * Updates the Inode using information from the stats object. Used by file
     * systems at sync time, e.g.:
     * - Program opens file and gets a File object.
     * - Program mutates file. File object is responsible for maintaining
     *   metadata changes locally -- typically in a Stats object.
     * - Program closes file. File object's metadata changes are synced with the
     *   file system.
     * @return True if any changes have occurred.
     */
    update(stats) {
        let hasChanged = false;
        if (this.size !== stats.size) {
            this.size = stats.size;
            hasChanged = true;
        }
        if (this.mode !== stats.mode) {
            this.mode = stats.mode;
            hasChanged = true;
        }
        if (this.nlink !== stats.nlink) {
            this.nlink = stats.nlink;
            hasChanged = true;
        }
        if (this.uid !== stats.uid) {
            this.uid = stats.uid;
            hasChanged = true;
        }
        if (this.uid !== stats.uid) {
            this.uid = stats.uid;
            hasChanged = true;
        }
        if (this.atimeMs !== stats.atimeMs) {
            this.atimeMs = stats.atimeMs;
            hasChanged = true;
        }
        if (this.mtimeMs !== stats.mtimeMs) {
            this.mtimeMs = stats.mtimeMs;
            hasChanged = true;
        }
        if (this.ctimeMs !== stats.ctimeMs) {
            this.ctimeMs = stats.ctimeMs;
            hasChanged = true;
        }
        return hasChanged;
    }
}
