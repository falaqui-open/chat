import { S_IFBLK, S_IFCHR, S_IFDIR, S_IFIFO, S_IFLNK, S_IFMT, S_IFREG, S_IFSOCK, S_IRWXG, S_IRWXO, S_IRWXU } from './emulation/constants.js';
import { size_max } from './inode.js';
/**
 * Provides information about a particular entry in the file system.
 * Common code used by both Stats and BigIntStats.
 */
export class StatsCommon {
    _convert(arg) {
        return (this._isBigint ? BigInt(arg) : Number(arg));
    }
    get blocks() {
        return this._convert(Math.ceil(Number(this.size) / 512));
    }
    get atime() {
        return new Date(Number(this.atimeMs));
    }
    set atime(value) {
        this.atimeMs = this._convert(value.getTime());
    }
    get mtime() {
        return new Date(Number(this.mtimeMs));
    }
    set mtime(value) {
        this.mtimeMs = this._convert(value.getTime());
    }
    get ctime() {
        return new Date(Number(this.ctimeMs));
    }
    set ctime(value) {
        this.ctimeMs = this._convert(value.getTime());
    }
    get birthtime() {
        return new Date(Number(this.birthtimeMs));
    }
    set birthtime(value) {
        this.birthtimeMs = this._convert(value.getTime());
    }
    /**
     * Creates a new stats instance from a stats-like object. Can be used to copy stats (note)
     */
    constructor({ atimeMs, mtimeMs, ctimeMs, birthtimeMs, uid, gid, size, mode, ino } = {}) {
        /**
         * ID of device containing file
         */
        this.dev = this._convert(0);
        /**
         * inode number
         */
        this.ino = this._convert(0);
        /**
         * device ID (if special file)
         */
        this.rdev = this._convert(0);
        /**
         * number of hard links
         */
        this.nlink = this._convert(1);
        /**
         * blocksize for file system I/O
         */
        this.blksize = this._convert(4096);
        /**
         * user ID of owner
         */
        this.uid = this._convert(0);
        /**
         * group ID of owner
         */
        this.gid = this._convert(0);
        const now = Date.now();
        this.atimeMs = this._convert(atimeMs ?? now);
        this.mtimeMs = this._convert(mtimeMs ?? now);
        this.ctimeMs = this._convert(ctimeMs ?? now);
        this.birthtimeMs = this._convert(birthtimeMs ?? now);
        this.uid = this._convert(uid ?? 0);
        this.gid = this._convert(gid ?? 0);
        this.size = this._convert(size ?? 0);
        this.ino = this._convert(ino ?? 0);
        this.mode = this._convert(mode ?? 0o644 & S_IFREG);
        if ((this.mode & S_IFMT) == 0) {
            this.mode = (this.mode | this._convert(S_IFREG));
        }
    }
    /**
     * @returns true if this item is a file.
     */
    isFile() {
        return (this.mode & S_IFMT) === S_IFREG;
    }
    /**
     * @returns True if this item is a directory.
     */
    isDirectory() {
        return (this.mode & S_IFMT) === S_IFDIR;
    }
    /**
     * @returns true if this item is a symbolic link
     */
    isSymbolicLink() {
        return (this.mode & S_IFMT) === S_IFLNK;
    }
    // Currently unsupported
    isSocket() {
        return (this.mode & S_IFMT) === S_IFSOCK;
    }
    isBlockDevice() {
        return (this.mode & S_IFMT) === S_IFBLK;
    }
    isCharacterDevice() {
        return (this.mode & S_IFMT) === S_IFCHR;
    }
    isFIFO() {
        return (this.mode & S_IFMT) === S_IFIFO;
    }
    /**
     * Checks if a given user/group has access to this item
     * @param mode The requested access, combination of W_OK, R_OK, and X_OK
     * @param cred The requesting credentials
     * @returns True if the request has access, false if the request does not
     * @internal
     */
    hasAccess(mode, cred) {
        if (cred.euid === 0 || cred.egid === 0) {
            //Running as root
            return true;
        }
        // Mask for
        const adjusted = (cred.uid == this.uid ? S_IRWXU : 0) | (cred.gid == this.gid ? S_IRWXG : 0) | S_IRWXO;
        return (mode & this.mode & adjusted) == mode;
    }
    /**
     * Convert the current stats object into a credentials object
     * @internal
     */
    cred(uid = Number(this.uid), gid = Number(this.gid)) {
        return {
            uid,
            gid,
            suid: Number(this.uid),
            sgid: Number(this.gid),
            euid: uid,
            egid: gid,
        };
    }
    /**
     * Change the mode of the file. We use this helper function to prevent messing
     * up the type of the file, which is encoded in mode.
     * @internal
     */
    chmod(mode) {
        this.mode = this._convert((this.mode & S_IFMT) | mode);
    }
    /**
     * Change the owner user/group of the file.
     * This function makes sure it is a valid UID/GID (that is, a 32 unsigned int)
     * @internal
     */
    chown(uid, gid) {
        uid = Number(uid);
        gid = Number(gid);
        if (!isNaN(uid) && 0 <= uid && uid < 2 ** 32) {
            this.uid = this._convert(uid);
        }
        if (!isNaN(gid) && 0 <= gid && gid < 2 ** 32) {
            this.gid = this._convert(gid);
        }
    }
    get atimeNs() {
        return BigInt(this.atimeMs) * 1000n;
    }
    get mtimeNs() {
        return BigInt(this.mtimeMs) * 1000n;
    }
    get ctimeNs() {
        return BigInt(this.ctimeMs) * 1000n;
    }
    get birthtimeNs() {
        return BigInt(this.birthtimeMs) * 1000n;
    }
}
/**
 * Implementation of Node's `Stats`.
 *
 * Attribute descriptions are from `man 2 stat'
 * @see http://nodejs.org/api/fs.html#fs_class_fs_stats
 * @see http://man7.org/linux/man-pages/man2/stat.2.html
 */
export class Stats extends StatsCommon {
    constructor() {
        super(...arguments);
        this._isBigint = false;
    }
}
Stats;
/**
 * Stats with bigint
 */
export class BigIntStats extends StatsCommon {
    constructor() {
        super(...arguments);
        this._isBigint = true;
    }
}
/**
 * Determines if the file stats have changed by comparing relevant properties.
 *
 * @param left The previous stats.
 * @param right The current stats.
 * @returns `true` if stats have changed; otherwise, `false`.
 * @internal
 */
export function isStatsEqual(left, right) {
    return left.size == right.size && +left.atime == +right.atime && +left.mtime == +right.mtime && +left.ctime == +right.ctime && left.mode == right.mode;
}
/**
 * @internal
 */
export const ZenFsType = 0x7a656e6673; // 'z' 'e' 'n' 'f' 's'
/**
 * @hidden
 */
export class StatsFs {
    constructor() {
        /** Type of file system. */
        this.type = 0x7a656e6673;
        /**  Optimal transfer block size. */
        this.bsize = 4096;
        /**  Total data blocks in file system. */
        this.blocks = 0;
        /** Free blocks in file system. */
        this.bfree = 0;
        /** Available blocks for unprivileged users */
        this.bavail = 0;
        /** Total file nodes in file system. */
        this.files = size_max;
        /** Free file nodes in file system. */
        this.ffree = size_max;
    }
}
/**
 * @hidden
 */
export class BigIntStatsFs {
    constructor() {
        /** Type of file system. */
        this.type = 0x7a656e6673n;
        /**  Optimal transfer block size. */
        this.bsize = 4096n;
        /**  Total data blocks in file system. */
        this.blocks = 0n;
        /** Free blocks in file system. */
        this.bfree = 0n;
        /** Available blocks for unprivileged users */
        this.bavail = 0n;
        /** Total file nodes in file system. */
        this.files = BigInt(size_max);
        /** Free file nodes in file system. */
        this.ffree = BigInt(size_max);
    }
}
