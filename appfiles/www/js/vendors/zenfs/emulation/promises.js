var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Buffer } from 'buffer';
import { Errno, ErrnoError } from '../error.js';
import { flagToMode, isAppendable, isExclusive, isReadable, isTruncating, isWriteable, parseFlag } from '../file.js';
import '../polyfills.js';
import { BigIntStats } from '../stats.js';
import { normalizeMode, normalizeOptions, normalizePath, normalizeTime } from '../utils.js';
import * as constants from './constants.js';
import { Dir, Dirent } from './dir.js';
import { dirname, join, parse } from './path.js';
import { _statfs, fd2file, fdMap, file2fd, fixError, mounts, resolveMount } from './shared.js';
import { credentials } from '../credentials.js';
import { ReadStream, WriteStream } from './streams.js';
import { FSWatcher, emitChange } from './watchers.js';
export * as constants from './constants.js';
export class FileHandle {
    constructor(fdOrFile) {
        const isFile = typeof fdOrFile != 'number';
        this.fd = isFile ? file2fd(fdOrFile) : fdOrFile;
        this.file = isFile ? fdOrFile : fd2file(fdOrFile);
    }
    /**
     * Asynchronous fchown(2) - Change ownership of a file.
     */
    async chown(uid, gid) {
        await this.file.chown(uid, gid);
        emitChange('change', this.file.path);
    }
    /**
     * Asynchronous fchmod(2) - Change permissions of a file.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    async chmod(mode) {
        const numMode = normalizeMode(mode, -1);
        if (numMode < 0) {
            throw new ErrnoError(Errno.EINVAL, 'Invalid mode.');
        }
        await this.file.chmod(numMode);
        emitChange('change', this.file.path);
    }
    /**
     * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
     */
    datasync() {
        return this.file.datasync();
    }
    /**
     * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
     */
    sync() {
        return this.file.sync();
    }
    /**
     * Asynchronous ftruncate(2) - Truncate a file to a specified length.
     * @param len If not specified, defaults to `0`.
     */
    async truncate(len) {
        len || (len = 0);
        if (len < 0) {
            throw new ErrnoError(Errno.EINVAL);
        }
        await this.file.truncate(len);
        emitChange('change', this.file.path);
    }
    /**
     * Asynchronously change file timestamps of the file.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    async utimes(atime, mtime) {
        await this.file.utimes(normalizeTime(atime), normalizeTime(mtime));
        emitChange('change', this.file.path);
    }
    /**
     * Asynchronously append data to a file, creating the file if it does not exist. The underlying file will _not_ be closed automatically.
     * The `FileHandle` must have been opened for appending.
     * @param data The data to write. If something other than a `Buffer` or `Uint8Array` is provided, the value is coerced to a string.
     * @param _options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'a'` is used.
     */
    async appendFile(data, _options = {}) {
        const options = normalizeOptions(_options, 'utf8', 'a', 0o644);
        const flag = parseFlag(options.flag);
        if (!isAppendable(flag)) {
            throw new ErrnoError(Errno.EINVAL, 'Flag passed to appendFile must allow for appending.');
        }
        if (typeof data != 'string' && !options.encoding) {
            throw new ErrnoError(Errno.EINVAL, 'Encoding not specified');
        }
        const encodedData = typeof data == 'string' ? Buffer.from(data, options.encoding) : data;
        await this.file.write(encodedData, 0, encodedData.length);
        emitChange('change', this.file.path);
    }
    /**
     * Asynchronously reads data from the file.
     * The `FileHandle` must have been opened for reading.
     * @param buffer The buffer that the data will be written to.
     * @param offset The offset in the buffer at which to start writing.
     * @param length The number of bytes to read.
     * @param position The offset from the beginning of the file from which data should be read. If `null`, data will be read from the current position.
     */
    read(buffer, offset, length, position) {
        if (isNaN(+position)) {
            position = this.file.position;
        }
        return this.file.read(buffer, offset, length, position);
    }
    async readFile(_options) {
        const options = normalizeOptions(_options, null, 'r', 0o444);
        const flag = parseFlag(options.flag);
        if (!isReadable(flag)) {
            throw new ErrnoError(Errno.EINVAL, 'Flag passed must allow for reading.');
        }
        const { size } = await this.stat();
        const { buffer: data } = await this.file.read(new Uint8Array(size), 0, size, 0);
        const buffer = Buffer.from(data);
        return options.encoding ? buffer.toString(options.encoding) : buffer;
    }
    /**
     * Returns a `ReadableStream` that may be used to read the files data.
     *
     * An error will be thrown if this method is called more than once or is called after the `FileHandle` is closed
     * or closing.
     *
     * While the `ReadableStream` will read the file to completion, it will not close the `FileHandle` automatically. User code must still call the `fileHandle.close()` method.
     *
     * @since v17.0.0
     * @experimental
     */
    readableWebStream(options = {}) {
        // Note: using an arrow function to preserve `this`
        const start = async (controller) => {
            try {
                const chunkSize = 64 * 1024, maxChunks = 1e7;
                let i = 0, position = 0, bytesRead = NaN;
                while (bytesRead > 0) {
                    const result = await this.read(new Uint8Array(chunkSize), 0, chunkSize, position);
                    if (!result.bytesRead) {
                        controller.close();
                        return;
                    }
                    controller.enqueue(result.buffer.slice(0, result.bytesRead));
                    position += result.bytesRead;
                    if (++i >= maxChunks) {
                        throw new ErrnoError(Errno.EFBIG, 'Too many iterations on readable stream', this.file.path, 'FileHandle.readableWebStream');
                    }
                    bytesRead = result.bytesRead;
                }
            }
            catch (e) {
                controller.error(e);
            }
        };
        const _gt = globalThis;
        if (!('ReadableStream' in _gt)) {
            throw new ErrnoError(Errno.ENOSYS, 'ReadableStream is missing on globalThis');
        }
        return new _gt.ReadableStream({ start, type: options.type });
    }
    readLines(options) {
        throw ErrnoError.With('ENOSYS', this.file.path, 'FileHandle.readLines');
    }
    [Symbol.asyncDispose]() {
        return this.close();
    }
    async stat(opts) {
        const stats = await this.file.stat();
        if (!stats.hasAccess(constants.R_OK, credentials)) {
            throw ErrnoError.With('EACCES', this.file.path, 'stat');
        }
        return opts?.bigint ? new BigIntStats(stats) : stats;
    }
    async write(data, posOrOff, lenOrEnc, position) {
        let buffer, offset, length;
        if (typeof data === 'string') {
            // Signature 1: (fd, string, [position?, [encoding?]])
            position = typeof posOrOff === 'number' ? posOrOff : null;
            const encoding = typeof lenOrEnc === 'string' ? lenOrEnc : 'utf8';
            offset = 0;
            buffer = Buffer.from(data, encoding);
            length = buffer.length;
        }
        else {
            // Signature 2: (fd, buffer, offset, length, position?)
            buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            offset = posOrOff;
            length = lenOrEnc;
            position = typeof position === 'number' ? position : null;
        }
        position ?? (position = this.file.position);
        const bytesWritten = await this.file.write(buffer, offset, length, position);
        emitChange('change', this.file.path);
        return { buffer, bytesWritten };
    }
    /**
     * Asynchronously writes data to a file, replacing the file if it already exists. The underlying file will _not_ be closed automatically.
     * The `FileHandle` must have been opened for writing.
     * It is unsafe to call `writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).
     * @param data The data to write. If something other than a `Buffer` or `Uint8Array` is provided, the value is coerced to a string.
     * @param _options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'w'` is used.
     */
    async writeFile(data, _options = {}) {
        const options = normalizeOptions(_options, 'utf8', 'w', 0o644);
        const flag = parseFlag(options.flag);
        if (!isWriteable(flag)) {
            throw new ErrnoError(Errno.EINVAL, 'Flag passed must allow for writing.');
        }
        if (typeof data != 'string' && !options.encoding) {
            throw new ErrnoError(Errno.EINVAL, 'Encoding not specified');
        }
        const encodedData = typeof data == 'string' ? Buffer.from(data, options.encoding) : data;
        await this.file.write(encodedData, 0, encodedData.length, 0);
        emitChange('change', this.file.path);
    }
    /**
     * Asynchronous close(2) - close a `FileHandle`.
     */
    async close() {
        await this.file.close();
        fdMap.delete(this.fd);
    }
    /**
     * Asynchronous `writev`. Writes from multiple buffers.
     * @param buffers An array of Uint8Array buffers.
     * @param position The position in the file where to begin writing.
     * @returns The number of bytes written.
     */
    async writev(buffers, position) {
        let bytesWritten = 0;
        for (const buffer of buffers) {
            bytesWritten += (await this.write(buffer, 0, buffer.length, position + bytesWritten)).bytesWritten;
        }
        return { bytesWritten, buffers };
    }
    /**
     * Asynchronous `readv`. Reads into multiple buffers.
     * @param buffers An array of Uint8Array buffers.
     * @param position The position in the file where to begin reading.
     * @returns The number of bytes read.
     */
    async readv(buffers, position) {
        let bytesRead = 0;
        for (const buffer of buffers) {
            bytesRead += (await this.read(buffer, 0, buffer.byteLength, position + bytesRead)).bytesRead;
        }
        return { bytesRead, buffers };
    }
    /**
     * Creates a `ReadStream` for reading from the file.
     *
     * @param options Options for the readable stream
     * @returns A `ReadStream` object.
     */
    createReadStream(options) {
        const stream = new ReadStream({
            highWaterMark: options?.highWaterMark || 64 * 1024,
            encoding: options.encoding,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            read: async (size) => {
                try {
                    const result = await this.read(new Uint8Array(size), 0, size, this.file.position);
                    stream.push(!result.bytesRead ? null : result.buffer.slice(0, result.bytesRead)); // Push data or null for EOF
                    this.file.position += result.bytesRead;
                }
                catch (error) {
                    stream.destroy(error);
                }
            },
        });
        stream.path = this.file.path;
        return stream;
    }
    /**
     * Creates a `WriteStream` for writing to the file.
     *
     * @param options Options for the writeable stream.
     * @returns A `WriteStream` object
     */
    createWriteStream(options) {
        const streamOptions = {
            highWaterMark: options?.highWaterMark,
            encoding: options?.encoding,
            write: async (chunk, encoding, callback) => {
                try {
                    const { bytesWritten } = await this.write(chunk, null, encoding);
                    callback(bytesWritten == chunk.length ? null : new Error('Failed to write full chunk'));
                }
                catch (error) {
                    callback(error);
                }
            },
        };
        const stream = new WriteStream(streamOptions);
        stream.path = this.file.path;
        return stream;
    }
}
/**
 * Renames a file
 * @param oldPath
 * @param newPath
 */
export async function rename(oldPath, newPath) {
    oldPath = normalizePath(oldPath);
    newPath = normalizePath(newPath);
    const src = resolveMount(oldPath);
    const dst = resolveMount(newPath);
    if (!(await stat(dirname(oldPath))).hasAccess(constants.W_OK, credentials)) {
        throw ErrnoError.With('EACCES', oldPath, 'rename');
    }
    try {
        if (src.mountPoint == dst.mountPoint) {
            await src.fs.rename(src.path, dst.path);
            emitChange('rename', oldPath.toString());
            return;
        }
        await writeFile(newPath, await readFile(oldPath));
        await unlink(oldPath);
        emitChange('rename', oldPath.toString());
    }
    catch (e) {
        throw fixError(e, { [src.path]: oldPath, [dst.path]: newPath });
    }
}
rename;
/**
 * Test whether or not the given path exists by checking with the file system.
 * @param path
 */
export async function exists(path) {
    try {
        const { fs, path: resolved } = resolveMount(await realpath(path));
        return await fs.exists(resolved);
    }
    catch (e) {
        if (e instanceof ErrnoError && e.code == 'ENOENT') {
            return false;
        }
        throw e;
    }
}
export async function stat(path, options) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount((await exists(path)) ? await realpath(path) : path);
    try {
        const stats = await fs.stat(resolved);
        if (!stats.hasAccess(constants.R_OK, credentials)) {
            throw ErrnoError.With('EACCES', path, 'stat');
        }
        return options?.bigint ? new BigIntStats(stats) : stats;
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
stat;
export async function lstat(path, options) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(path);
    try {
        const stats = await fs.stat(resolved);
        return options?.bigint ? new BigIntStats(stats) : stats;
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
lstat;
// FILE-ONLY METHODS
/**
 * `truncate`.
 * @param path
 * @param len
 */
export async function truncate(path, len = 0) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_1, await open(path, 'r+'), true);
        await handle.truncate(len);
    }
    catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
    }
    finally {
        const result_1 = __disposeResources(env_1);
        if (result_1)
            await result_1;
    }
}
truncate;
/**
 * `unlink`.
 * @param path
 */
export async function unlink(path) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(path);
    try {
        if (!(await fs.stat(resolved)).hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', resolved, 'unlink');
        }
        await fs.unlink(resolved);
        emitChange('rename', path.toString());
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
unlink;
/**
 * Opens a file. This helper handles the complexity of file flags.
 * @internal
 */
async function _open(path, _flag, _mode = 0o644, resolveSymlinks) {
    path = normalizePath(path);
    const mode = normalizeMode(_mode, 0o644), flag = parseFlag(_flag);
    path = resolveSymlinks && (await exists(path)) ? await realpath(path) : path;
    const { fs, path: resolved } = resolveMount(path);
    const stats = await fs.stat(resolved).catch(() => null);
    if (!stats) {
        if ((!isWriteable(flag) && !isAppendable(flag)) || flag == 'r+') {
            throw ErrnoError.With('ENOENT', path, '_open');
        }
        // Create the file
        const parentStats = await fs.stat(dirname(resolved));
        if (!parentStats.hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', dirname(path), '_open');
        }
        if (!parentStats.isDirectory()) {
            throw ErrnoError.With('ENOTDIR', dirname(path), '_open');
        }
        return new FileHandle(await fs.createFile(resolved, flag, mode));
    }
    if (!stats.hasAccess(flagToMode(flag), credentials)) {
        throw ErrnoError.With('EACCES', path, '_open');
    }
    if (isExclusive(flag)) {
        throw ErrnoError.With('EEXIST', path, '_open');
    }
    const handle = new FileHandle(await fs.openFile(resolved, flag));
    /*
        In a previous implementation, we deleted the file and
        re-created it. However, this created a race condition if another
        asynchronous request was trying to read the file, as the file
        would not exist for a small period of time.
    */
    if (isTruncating(flag)) {
        await handle.truncate(0);
        await handle.sync();
    }
    return handle;
}
/**
 * Asynchronous file open.
 * @see http://www.manpagez.com/man/2/open/
 * @param flags Handles the complexity of the various file modes. See its API for more details.
 * @param mode Mode to use to open the file. Can be ignored if the filesystem doesn't support permissions.
 */
export async function open(path, flag = 'r', mode = 0o644) {
    return await _open(path, flag, mode, true);
}
open;
export async function readFile(path, _options) {
    const env_2 = { stack: [], error: void 0, hasError: false };
    try {
        const options = normalizeOptions(_options, null, 'r', 0o644);
        const handle = __addDisposableResource(env_2, typeof path == 'object' && 'fd' in path ? path : await open(path, options.flag, options.mode), true);
        return await handle.readFile(options);
    }
    catch (e_2) {
        env_2.error = e_2;
        env_2.hasError = true;
    }
    finally {
        const result_2 = __disposeResources(env_2);
        if (result_2)
            await result_2;
    }
}
readFile;
/**
 * Asynchronously writes data to a file, replacing the file if it already exists.
 *
 * The encoding option is ignored if data is a buffer.
 * @param path
 * @param data Note:
 * @param _options
 * @option options encoding Defaults to `'utf8'`.
 * @option options mode Defaults to `0644`.
 * @option options flag Defaults to `'w'`.
 */
export async function writeFile(path, data, _options) {
    const env_3 = { stack: [], error: void 0, hasError: false };
    try {
        const options = normalizeOptions(_options, 'utf8', 'w+', 0o644);
        const handle = __addDisposableResource(env_3, path instanceof FileHandle ? path : await open(path.toString(), options.flag, options.mode), true);
        const _data = typeof data == 'string' ? data : data;
        if (typeof _data != 'string' && !(_data instanceof Uint8Array)) {
            throw new ErrnoError(Errno.EINVAL, 'Iterables and streams not supported', handle.file.path, 'writeFile');
        }
        await handle.writeFile(_data, options);
    }
    catch (e_3) {
        env_3.error = e_3;
        env_3.hasError = true;
    }
    finally {
        const result_3 = __disposeResources(env_3);
        if (result_3)
            await result_3;
    }
}
writeFile;
/**
 * Asynchronously append data to a file, creating the file if it not yet
 * exists.
 * @param path
 * @param data
 * @param options
 * @option options encoding Defaults to `'utf8'`.
 * @option options mode Defaults to `0644`.
 * @option options flag Defaults to `'a'`.
 */
export async function appendFile(path, data, _options) {
    const env_4 = { stack: [], error: void 0, hasError: false };
    try {
        const options = normalizeOptions(_options, 'utf8', 'a', 0o644);
        const flag = parseFlag(options.flag);
        if (!isAppendable(flag)) {
            throw new ErrnoError(Errno.EINVAL, 'Flag passed to appendFile must allow for appending.');
        }
        if (typeof data != 'string' && !options.encoding) {
            throw new ErrnoError(Errno.EINVAL, 'Encoding not specified');
        }
        const encodedData = typeof data == 'string' ? Buffer.from(data, options.encoding) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const handle = __addDisposableResource(env_4, typeof path == 'object' && 'fd' in path ? path : await open(path, options.flag, options.mode), true);
        await handle.appendFile(encodedData, options);
    }
    catch (e_4) {
        env_4.error = e_4;
        env_4.hasError = true;
    }
    finally {
        const result_4 = __disposeResources(env_4);
        if (result_4)
            await result_4;
    }
}
appendFile;
// DIRECTORY-ONLY METHODS
/**
 * `rmdir`.
 * @param path
 */
export async function rmdir(path) {
    path = normalizePath(path);
    path = (await exists(path)) ? await realpath(path) : path;
    const { fs, path: resolved } = resolveMount(path);
    try {
        if (!(await fs.stat(resolved)).hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', resolved, 'rmdir');
        }
        await fs.rmdir(resolved);
        emitChange('rename', path.toString());
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
rmdir;
export async function mkdir(path, options) {
    options = typeof options === 'object' ? options : { mode: options };
    const mode = normalizeMode(options?.mode, 0o777);
    path = normalizePath(path);
    path = (await exists(path)) ? await realpath(path) : path;
    const { fs, path: resolved } = resolveMount(path);
    const errorPaths = { [resolved]: path };
    try {
        if (!options?.recursive) {
            if (!(await fs.stat(dirname(resolved))).hasAccess(constants.W_OK, credentials)) {
                throw ErrnoError.With('EACCES', dirname(resolved), 'mkdir');
            }
            await fs.mkdir(resolved, mode);
            emitChange('rename', path.toString());
            return;
        }
        const dirs = [];
        for (let dir = resolved, origDir = path; !(await fs.exists(dir)); dir = dirname(dir), origDir = dirname(origDir)) {
            dirs.unshift(dir);
            errorPaths[dir] = origDir;
        }
        for (const dir of dirs) {
            if (!(await fs.stat(dirname(dir))).hasAccess(constants.W_OK, credentials)) {
                throw ErrnoError.With('EACCES', dirname(dir), 'mkdir');
            }
            await fs.mkdir(dir, mode);
            emitChange('rename', dir);
        }
        return dirs[0];
    }
    catch (e) {
        throw fixError(e, errorPaths);
    }
}
mkdir;
export async function readdir(path, options) {
    path = normalizePath(path);
    if (!(await stat(path)).hasAccess(constants.R_OK, credentials)) {
        throw ErrnoError.With('EACCES', path, 'readdir');
    }
    path = (await exists(path)) ? await realpath(path) : path;
    const { fs, path: resolved } = resolveMount(path);
    let entries;
    try {
        entries = await fs.readdir(resolved);
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
    for (const point of mounts.keys()) {
        if (point.startsWith(path)) {
            const entry = point.slice(path.length);
            if (entry.includes('/') || entry.length == 0) {
                // ignore FSs mounted in subdirectories and any FS mounted to `path`.
                continue;
            }
            entries.push(entry);
        }
    }
    const values = [];
    for (const entry of entries) {
        values.push(typeof options == 'object' && options?.withFileTypes ? new Dirent(entry, await stat(join(path, entry))) : entry);
    }
    return values;
}
readdir;
// SYMLINK METHODS
/**
 * `link`.
 * @param targetPath
 * @param linkPath
 */
export async function link(targetPath, linkPath) {
    targetPath = normalizePath(targetPath);
    if (!(await stat(dirname(targetPath))).hasAccess(constants.R_OK, credentials)) {
        throw ErrnoError.With('EACCES', dirname(targetPath), 'link');
    }
    linkPath = normalizePath(linkPath);
    if (!(await stat(dirname(linkPath))).hasAccess(constants.W_OK, credentials)) {
        throw ErrnoError.With('EACCES', dirname(linkPath), 'link');
    }
    const { fs, path } = resolveMount(targetPath);
    const link = resolveMount(linkPath);
    if (fs != link.fs) {
        throw ErrnoError.With('EXDEV', linkPath, 'link');
    }
    try {
        if (!(await fs.stat(path)).hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', path, 'link');
        }
        return await fs.link(path, link.path);
    }
    catch (e) {
        throw fixError(e, { [link.path]: linkPath, [path]: targetPath });
    }
}
link;
/**
 * `symlink`.
 * @param target target path
 * @param path link path
 * @param type can be either `'dir'` or `'file'` (default is `'file'`)
 */
export async function symlink(target, path, type = 'file') {
    if (!['file', 'dir', 'junction'].includes(type)) {
        throw new ErrnoError(Errno.EINVAL, 'Invalid symlink type: ' + type);
    }
    if (await exists(path)) {
        throw ErrnoError.With('EEXIST', path.toString(), 'symlink');
    }
    await writeFile(path, target.toString());
    const handle = await _open(path, 'r+', 0o644, false);
    await handle.file._setType(constants.S_IFLNK);
}
symlink;
export async function readlink(path, options) {
    const env_5 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_5, await _open(normalizePath(path), 'r', 0o644, false), true);
        const value = await handle.readFile();
        const encoding = typeof options == 'object' ? options?.encoding : options;
        return encoding == 'buffer' ? value : value.toString(encoding);
    }
    catch (e_5) {
        env_5.error = e_5;
        env_5.hasError = true;
    }
    finally {
        const result_5 = __disposeResources(env_5);
        if (result_5)
            await result_5;
    }
}
readlink;
// PROPERTY OPERATIONS
/**
 * `chown`.
 * @param path
 * @param uid
 * @param gid
 */
export async function chown(path, uid, gid) {
    const env_6 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_6, await open(path, 'r+'), true);
        await handle.chown(uid, gid);
    }
    catch (e_6) {
        env_6.error = e_6;
        env_6.hasError = true;
    }
    finally {
        const result_6 = __disposeResources(env_6);
        if (result_6)
            await result_6;
    }
}
chown;
/**
 * `lchown`.
 * @param path
 * @param uid
 * @param gid
 */
export async function lchown(path, uid, gid) {
    const env_7 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_7, await _open(path, 'r+', 0o644, false), true);
        await handle.chown(uid, gid);
    }
    catch (e_7) {
        env_7.error = e_7;
        env_7.hasError = true;
    }
    finally {
        const result_7 = __disposeResources(env_7);
        if (result_7)
            await result_7;
    }
}
lchown;
/**
 * `chmod`.
 * @param path
 * @param mode
 */
export async function chmod(path, mode) {
    const env_8 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_8, await open(path, 'r+'), true);
        await handle.chmod(mode);
    }
    catch (e_8) {
        env_8.error = e_8;
        env_8.hasError = true;
    }
    finally {
        const result_8 = __disposeResources(env_8);
        if (result_8)
            await result_8;
    }
}
chmod;
/**
 * `lchmod`.
 * @param path
 * @param mode
 */
export async function lchmod(path, mode) {
    const env_9 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_9, await _open(path, 'r+', 0o644, false), true);
        await handle.chmod(mode);
    }
    catch (e_9) {
        env_9.error = e_9;
        env_9.hasError = true;
    }
    finally {
        const result_9 = __disposeResources(env_9);
        if (result_9)
            await result_9;
    }
}
lchmod;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 */
export async function utimes(path, atime, mtime) {
    const env_10 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_10, await open(path, 'r+'), true);
        await handle.utimes(atime, mtime);
    }
    catch (e_10) {
        env_10.error = e_10;
        env_10.hasError = true;
    }
    finally {
        const result_10 = __disposeResources(env_10);
        if (result_10)
            await result_10;
    }
}
utimes;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 */
export async function lutimes(path, atime, mtime) {
    const env_11 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_11, await _open(path, 'r+', 0o644, false), true);
        await handle.utimes(new Date(atime), new Date(mtime));
    }
    catch (e_11) {
        env_11.error = e_11;
        env_11.hasError = true;
    }
    finally {
        const result_11 = __disposeResources(env_11);
        if (result_11)
            await result_11;
    }
}
lutimes;
export async function realpath(path, options) {
    path = normalizePath(path);
    const { base, dir } = parse(path);
    const lpath = join(dir == '/' ? '/' : await realpath(dir), base);
    const { fs, path: resolvedPath, mountPoint } = resolveMount(lpath);
    try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isSymbolicLink()) {
            return lpath;
        }
        return realpath(mountPoint + (await readlink(lpath)));
    }
    catch (e) {
        throw fixError(e, { [resolvedPath]: lpath });
    }
}
realpath;
export function watch(filename, options = {}) {
    return {
        [Symbol.asyncIterator]() {
            const watcher = new FSWatcher(filename.toString(), typeof options != 'string' ? options : { encoding: options });
            function withDone(done) {
                return function () {
                    const event = Promise.withResolvers();
                    watcher.on('change', (eventType, filename) => {
                        event.resolve({ value: { eventType, filename }, done });
                    });
                    return event.promise;
                };
            }
            return {
                next: withDone(false),
                return: withDone(true),
                throw: withDone(true),
            };
        },
    };
}
watch;
/**
 * `access`.
 * @param path
 * @param mode
 */
export async function access(path, mode = constants.F_OK) {
    const stats = await stat(path);
    if (!stats.hasAccess(mode, credentials)) {
        throw new ErrnoError(Errno.EACCES);
    }
}
access;
/**
 * Asynchronous `rm`. Removes files or directories (recursively).
 * @param path The path to the file or directory to remove.
 */
export async function rm(path, options) {
    path = normalizePath(path);
    const stats = await stat(path);
    switch (stats.mode & constants.S_IFMT) {
        case constants.S_IFDIR:
            if (options?.recursive) {
                for (const entry of await readdir(path)) {
                    await rm(join(path, entry), options);
                }
            }
            await rmdir(path);
            return;
        case constants.S_IFREG:
        case constants.S_IFLNK:
            await unlink(path);
            return;
        case constants.S_IFBLK:
        case constants.S_IFCHR:
        case constants.S_IFIFO:
        case constants.S_IFSOCK:
        default:
            throw new ErrnoError(Errno.EPERM, 'File type not supported', path, 'rm');
    }
}
rm;
export async function mkdtemp(prefix, options) {
    const encoding = typeof options === 'object' ? options?.encoding : options || 'utf8';
    const fsName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const resolvedPath = '/tmp/' + fsName;
    await mkdir(resolvedPath);
    return encoding == 'buffer' ? Buffer.from(resolvedPath) : resolvedPath;
}
mkdtemp;
/**
 * Asynchronous `copyFile`. Copies a file.
 * @param src The source file.
 * @param dest The destination file.
 * @param mode Optional flags for the copy operation. Currently supports these flags:
 *    * `fs.constants.COPYFILE_EXCL`: If the destination file already exists, the operation fails.
 */
export async function copyFile(src, dest, mode) {
    src = normalizePath(src);
    dest = normalizePath(dest);
    if (mode && mode & constants.COPYFILE_EXCL && (await exists(dest))) {
        throw new ErrnoError(Errno.EEXIST, 'Destination file already exists.', dest, 'copyFile');
    }
    await writeFile(dest, await readFile(src));
    emitChange('rename', dest.toString());
}
copyFile;
/**
 * Asynchronous `opendir`. Opens a directory.
 * @param path The path to the directory.
 * @param options Options for opening the directory.
 * @returns A `Dir` object representing the opened directory.
 * @todo Use options
 */
export async function opendir(path, options) {
    path = normalizePath(path);
    return new Dir(path);
}
opendir;
/**
 * Asynchronous `cp`. Recursively copies a file or directory.
 * @param source The source file or directory.
 * @param destination The destination file or directory.
 * @param opts Options for the copy operation. Currently supports these options from Node.js 'fs.await cp':
 *   * `dereference`: Dereference symbolic links.
 *   * `errorOnExist`: Throw an error if the destination file or directory already exists.
 *   * `filter`: A function that takes a source and destination path and returns a boolean, indicating whether to copy the given source element.
 *   * `force`: Overwrite the destination if it exists, and overwrite existing readonly destination files.
 *   * `preserveTimestamps`: Preserve file timestamps.
 *   * `recursive`: If `true`, copies directories recursively.
 */
export async function cp(source, destination, opts) {
    source = normalizePath(source);
    destination = normalizePath(destination);
    const srcStats = await lstat(source); // Use lstat to follow symlinks if not dereferencing
    if (opts?.errorOnExist && (await exists(destination))) {
        throw new ErrnoError(Errno.EEXIST, 'Destination file or directory already exists.', destination, 'cp');
    }
    switch (srcStats.mode & constants.S_IFMT) {
        case constants.S_IFDIR:
            if (!opts?.recursive) {
                throw new ErrnoError(Errno.EISDIR, source + ' is a directory (not copied)', source, 'cp');
            }
            await mkdir(destination, { recursive: true }); // Ensure the destination directory exists
            for (const dirent of await readdir(source, { withFileTypes: true })) {
                if (opts.filter && !opts.filter(join(source, dirent.name), join(destination, dirent.name))) {
                    continue; // Skip if the filter returns false
                }
                await cp(join(source, dirent.name), join(destination, dirent.name), opts);
            }
            break;
        case constants.S_IFREG:
        case constants.S_IFLNK:
            await copyFile(source, destination);
            break;
        case constants.S_IFBLK:
        case constants.S_IFCHR:
        case constants.S_IFIFO:
        case constants.S_IFSOCK:
        default:
            throw new ErrnoError(Errno.EPERM, 'File type not supported', source, 'rm');
    }
    // Optionally preserve timestamps
    if (opts?.preserveTimestamps) {
        await utimes(destination, srcStats.atime, srcStats.mtime);
    }
}
cp;
export async function statfs(path, opts) {
    path = normalizePath(path);
    const { fs } = resolveMount(path);
    return _statfs(fs, opts?.bigint);
}
