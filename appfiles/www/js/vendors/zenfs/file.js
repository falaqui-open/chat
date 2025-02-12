import { O_APPEND, O_CREAT, O_EXCL, O_RDONLY, O_RDWR, O_SYNC, O_TRUNC, O_WRONLY, S_IFMT } from './emulation/constants.js';
import { Errno, ErrnoError } from './error.js';
import { size_max } from './inode.js';
import { Stats } from './stats.js';
import './polyfills.js';
const validFlags = ['r', 'r+', 'rs', 'rs+', 'w', 'wx', 'w+', 'wx+', 'a', 'ax', 'a+', 'ax+'];
export function parseFlag(flag) {
    if (typeof flag === 'number') {
        return flagToString(flag);
    }
    if (!validFlags.includes(flag)) {
        throw new Error('Invalid flag string: ' + flag);
    }
    return flag;
}
export function flagToString(flag) {
    switch (flag) {
        case O_RDONLY:
            return 'r';
        case O_RDONLY | O_SYNC:
            return 'rs';
        case O_RDWR:
            return 'r+';
        case O_RDWR | O_SYNC:
            return 'rs+';
        case O_TRUNC | O_CREAT | O_WRONLY:
            return 'w';
        case O_TRUNC | O_CREAT | O_WRONLY | O_EXCL:
            return 'wx';
        case O_TRUNC | O_CREAT | O_RDWR:
            return 'w+';
        case O_TRUNC | O_CREAT | O_RDWR | O_EXCL:
            return 'wx+';
        case O_APPEND | O_CREAT | O_WRONLY:
            return 'a';
        case O_APPEND | O_CREAT | O_WRONLY | O_EXCL:
            return 'ax';
        case O_APPEND | O_CREAT | O_RDWR:
            return 'a+';
        case O_APPEND | O_CREAT | O_RDWR | O_EXCL:
            return 'ax+';
        default:
            throw new Error('Invalid flag number: ' + flag);
    }
}
export function flagToNumber(flag) {
    switch (flag) {
        case 'r':
            return O_RDONLY;
        case 'rs':
            return O_RDONLY | O_SYNC;
        case 'r+':
            return O_RDWR;
        case 'rs+':
            return O_RDWR | O_SYNC;
        case 'w':
            return O_TRUNC | O_CREAT | O_WRONLY;
        case 'wx':
            return O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;
        case 'w+':
            return O_TRUNC | O_CREAT | O_RDWR;
        case 'wx+':
            return O_TRUNC | O_CREAT | O_RDWR | O_EXCL;
        case 'a':
            return O_APPEND | O_CREAT | O_WRONLY;
        case 'ax':
            return O_APPEND | O_CREAT | O_WRONLY | O_EXCL;
        case 'a+':
            return O_APPEND | O_CREAT | O_RDWR;
        case 'ax+':
            return O_APPEND | O_CREAT | O_RDWR | O_EXCL;
        default:
            throw new Error('Invalid flag string: ' + flag);
    }
}
/**
 * Parses a flag as a mode (W_OK, R_OK, and/or X_OK)
 * @param flag the flag to parse
 */
export function flagToMode(flag) {
    let mode = 0;
    mode <<= 1;
    mode += +isReadable(flag);
    mode <<= 1;
    mode += +isWriteable(flag);
    mode <<= 1;
    return mode;
}
export function isReadable(flag) {
    return flag.indexOf('r') !== -1 || flag.indexOf('+') !== -1;
}
export function isWriteable(flag) {
    return flag.indexOf('w') !== -1 || flag.indexOf('a') !== -1 || flag.indexOf('+') !== -1;
}
export function isTruncating(flag) {
    return flag.indexOf('w') !== -1;
}
export function isAppendable(flag) {
    return flag.indexOf('a') !== -1;
}
export function isSynchronous(flag) {
    return flag.indexOf('s') !== -1;
}
export function isExclusive(flag) {
    return flag.indexOf('x') !== -1;
}
export class File {
    [Symbol.asyncDispose]() {
        return this.close();
    }
    [Symbol.dispose]() {
        return this.closeSync();
    }
    /**
     * Asynchronous `datasync`.
     *
     * Default implementation maps to `sync`.
     */
    datasync() {
        return this.sync();
    }
    /**
     * Synchronous `datasync`.
     *
     * Default implementation maps to `syncSync`.
     */
    datasyncSync() {
        return this.syncSync();
    }
}
/**
 * An implementation of the File interface that operates on a file that is
 * completely in-memory. PreloadFiles are backed by a Uint8Array.
 *
 */
export class PreloadFile extends File {
    /**
     * Creates a file with the given path and, optionally, the given contents. Note
     * that, if contents is specified, it will be mutated by the file!
     * @param _mode The mode that the file was opened using.
     *   Dictates permissions and where the file pointer starts.
     * @param stats The stats object for the given file.
     *   PreloadFile will mutate this object. Note that this object must contain
     *   the appropriate mode that the file was opened as.
     * @param buffer A buffer containing the entire
     *   contents of the file. PreloadFile will mutate this buffer. If not
     *   specified, we assume it is a new file.
     */
    constructor(
    /**
     * The file system that created the file.
     */
    fs, 
    /**
     * Path to the file
     */
    path, flag, stats, _buffer = new Uint8Array(new ArrayBuffer(0, fs.metadata().noResizableBuffers ? {} : { maxByteLength: size_max }))) {
        super();
        this.fs = fs;
        this.path = path;
        this.flag = flag;
        this.stats = stats;
        this._buffer = _buffer;
        /**
         * Current position
         */
        this._position = 0;
        /**
         * Whether the file has changes which have not been written to the FS
         */
        this.dirty = false;
        /**
         * Whether the file is open or closed
         */
        this.closed = false;
        /*
            Note:
            This invariant is *not* maintained once the file starts getting modified.
            It only actually matters if file is readable, as writeable modes may truncate/append to file.
        */
        if (this.stats.size == _buffer.byteLength) {
            return;
        }
        if (isReadable(this.flag)) {
            throw new Error(`Size mismatch: buffer length ${_buffer.byteLength}, stats size ${this.stats.size}`);
        }
        this.dirty = true;
    }
    /**
     * Get the underlying buffer for this file. Mutating not recommended and will mess up dirty tracking.
     */
    get buffer() {
        return this._buffer;
    }
    /**
     * Get the current file position.
     *
     * We emulate the following bug mentioned in the Node documentation:
     * > On Linux, positional writes don't work when the file is opened in append
     *   mode. The kernel ignores the position argument and always appends the data
     *   to the end of the file.
     * @return The current file position.
     */
    get position() {
        if (isAppendable(this.flag)) {
            return this.stats.size;
        }
        return this._position;
    }
    /**
     * Set the file position.
     * @param newPos new position
     */
    set position(newPos) {
        this._position = newPos;
    }
    async sync() {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.sync');
        }
        if (!this.dirty) {
            return;
        }
        await this.fs.sync(this.path, this._buffer, this.stats);
        this.dirty = false;
    }
    syncSync() {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.sync');
        }
        if (!this.dirty) {
            return;
        }
        this.fs.syncSync(this.path, this._buffer, this.stats);
        this.dirty = false;
    }
    async close() {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.close');
        }
        await this.sync();
        this.dispose();
    }
    closeSync() {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.close');
        }
        this.syncSync();
        this.dispose();
    }
    /**
     * Cleans up
     * This will *not* sync the file data to the FS
     */
    dispose(force) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.dispose');
        }
        if (this.dirty && !force) {
            throw ErrnoError.With('EBUSY', this.path, 'File.dispose');
        }
        // @ts-expect-error 2790
        delete this._buffer;
        // @ts-expect-error 2790
        delete this.stats;
        this.closed = true;
    }
    /**
     * Asynchronous `stat`.
     */
    stat() {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.stat');
        }
        return Promise.resolve(new Stats(this.stats));
    }
    /**
     * Synchronous `stat`.
     */
    statSync() {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.stat');
        }
        return new Stats(this.stats);
    }
    _truncate(length) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.truncate');
        }
        this.dirty = true;
        if (!isWriteable(this.flag)) {
            throw new ErrnoError(Errno.EPERM, 'File not opened with a writeable mode.');
        }
        this.stats.mtimeMs = Date.now();
        if (length > this._buffer.length) {
            const data = new Uint8Array(length - this._buffer.length);
            // Write will set stats.size and handle syncing.
            this.writeSync(data, 0, data.length, this._buffer.length);
            return;
        }
        this.stats.size = length;
        // Truncate.
        this._buffer = this._buffer.slice(0, length);
    }
    /**
     * Asynchronous truncate.
     * @param length
     */
    async truncate(length) {
        this._truncate(length);
        await this.sync();
    }
    /**
     * Synchronous truncate.
     * @param length
     */
    truncateSync(length) {
        this._truncate(length);
        this.syncSync();
    }
    _write(buffer, offset = 0, length = this.stats.size, position = this.position) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.write');
        }
        this.dirty = true;
        if (!isWriteable(this.flag)) {
            throw new ErrnoError(Errno.EPERM, 'File not opened with a writeable mode.');
        }
        const end = position + length;
        if (end > this.stats.size) {
            this.stats.size = end;
            if (end > this._buffer.byteLength) {
                if (this._buffer.buffer.resizable && this._buffer.buffer.maxByteLength <= end) {
                    this._buffer.buffer.resize(end);
                }
                else {
                    // Extend the buffer!
                    const newBuffer = new Uint8Array(new ArrayBuffer(end, this.fs.metadata().noResizableBuffers ? {} : { maxByteLength: size_max }));
                    newBuffer.set(this._buffer);
                    this._buffer = newBuffer;
                }
            }
        }
        const slice = buffer.slice(offset, offset + length);
        this._buffer.set(slice, position);
        this.stats.mtimeMs = Date.now();
        this.position = position + slice.byteLength;
        return slice.byteLength;
    }
    /**
     * Write buffer to the file.
     * Note that it is unsafe to use fs.write multiple times on the same file
     * without waiting for the callback.
     * @param buffer Uint8Array containing the data to write to
     *  the file.
     * @param offset Offset in the buffer to start reading data from.
     * @param length The amount of bytes to write to the file.
     * @param position Offset from the beginning of the file where this
     *   data should be written. If position is null, the data will be written at
     *   the current position.
     */
    async write(buffer, offset, length, position) {
        const bytesWritten = this._write(buffer, offset, length, position);
        await this.sync();
        return bytesWritten;
    }
    /**
     * Write buffer to the file.
     * Note that it is unsafe to use fs.writeSync multiple times on the same file
     * without waiting for the callback.
     * @param buffer Uint8Array containing the data to write to
     *  the file.
     * @param offset Offset in the buffer to start reading data from.
     * @param length The amount of bytes to write to the file.
     * @param position Offset from the beginning of the file where this
     *   data should be written. If position is null, the data will be written at
     *   the current position.
     * @returns bytes written
     */
    writeSync(buffer, offset = 0, length = this.stats.size, position = this.position) {
        const bytesWritten = this._write(buffer, offset, length, position);
        this.syncSync();
        return bytesWritten;
    }
    _read(buffer, offset = 0, length = this.stats.size, position) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.read');
        }
        if (!isReadable(this.flag)) {
            throw new ErrnoError(Errno.EPERM, 'File not opened with a readable mode.');
        }
        this.dirty = true;
        position ?? (position = this.position);
        let end = position + length;
        if (end > this.stats.size) {
            end = position + Math.max(this.stats.size - position, 0);
        }
        this.stats.atimeMs = Date.now();
        this._position = end;
        const bytesRead = end - position;
        if (bytesRead == 0) {
            // No copy/read. Return immediatly for better performance
            return bytesRead;
        }
        new Uint8Array(buffer.buffer, offset, length).set(this._buffer.slice(position, end));
        return bytesRead;
    }
    /**
     * Read data from the file.
     * @param buffer The buffer that the data will be
     *   written to.
     * @param offset The offset within the buffer where writing will
     *   start.
     * @param length An integer specifying the number of bytes to read.
     * @param position An integer specifying where to begin reading from
     *   in the file. If position is null, data will be read from the current file
     *   position.
     */
    async read(buffer, offset, length, position) {
        const bytesRead = this._read(buffer, offset, length, position);
        await this.sync();
        return { bytesRead, buffer };
    }
    /**
     * Read data from the file.
     * @param buffer The buffer that the data will be
     *   written to.
     * @param offset The offset within the buffer where writing will start.
     * @param length An integer specifying the number of bytes to read.
     * @param position An integer specifying where to begin reading from
     *   in the file. If position is null, data will be read from the current file
     *   position.
     * @returns number of bytes written
     */
    readSync(buffer, offset, length, position) {
        const bytesRead = this._read(buffer, offset, length, position);
        this.statSync();
        return bytesRead;
    }
    /**
     * Asynchronous `fchmod`.
     * @param mode the mode
     */
    async chmod(mode) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.chmod');
        }
        this.dirty = true;
        this.stats.chmod(mode);
        await this.sync();
    }
    /**
     * Synchronous `fchmod`.
     * @param mode
     */
    chmodSync(mode) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.chmod');
        }
        this.dirty = true;
        this.stats.chmod(mode);
        this.syncSync();
    }
    /**
     * Asynchronous `fchown`.
     * @param uid
     * @param gid
     */
    async chown(uid, gid) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.chown');
        }
        this.dirty = true;
        this.stats.chown(uid, gid);
        await this.sync();
    }
    /**
     * Synchronous `fchown`.
     * @param uid
     * @param gid
     */
    chownSync(uid, gid) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.chown');
        }
        this.dirty = true;
        this.stats.chown(uid, gid);
        this.syncSync();
    }
    async utimes(atime, mtime) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.utimes');
        }
        this.dirty = true;
        this.stats.atime = atime;
        this.stats.mtime = mtime;
        await this.sync();
    }
    utimesSync(atime, mtime) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File.utimes');
        }
        this.dirty = true;
        this.stats.atime = atime;
        this.stats.mtime = mtime;
        this.syncSync();
    }
    async _setType(type) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File._setType');
        }
        this.dirty = true;
        this.stats.mode = (this.stats.mode & ~S_IFMT) | type;
        await this.sync();
    }
    _setTypeSync(type) {
        if (this.closed) {
            throw ErrnoError.With('EBADF', this.path, 'File._setType');
        }
        this.dirty = true;
        this.stats.mode = (this.stats.mode & ~S_IFMT) | type;
        this.syncSync();
    }
    async [Symbol.asyncDispose]() {
        await this.close();
    }
    [Symbol.dispose]() {
        this.closeSync();
    }
}
/**
 * For the filesystems which do not sync to anything..
 */
export class NoSyncFile extends PreloadFile {
    constructor(fs, path, flag, stats, contents) {
        super(fs, path, flag, stats, contents);
    }
    /**
     * Asynchronous sync. Doesn't do anything, simply calls the cb.
     */
    sync() {
        return Promise.resolve();
    }
    /**
     * Synchronous sync. Doesn't do anything.
     */
    syncSync() {
        // NOP.
    }
    /**
     * Asynchronous close. Doesn't do anything, simply calls the cb.
     */
    close() {
        return Promise.resolve();
    }
    /**
     * Synchronous close. Doesn't do anything.
     */
    closeSync() {
        // NOP.
    }
}
