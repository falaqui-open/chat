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
import { Buffer } from 'buffer';
import { Errno, ErrnoError } from '../error.js';
import { flagToMode, isAppendable, isExclusive, isReadable, isTruncating, isWriteable, parseFlag } from '../file.js';
import { BigIntStats } from '../stats.js';
import { normalizeMode, normalizeOptions, normalizePath, normalizeTime } from '../utils.js';
import * as constants from './constants.js';
import { Dir, Dirent } from './dir.js';
import { dirname, join, parse } from './path.js';
import { _statfs, fd2file, fdMap, file2fd, fixError, mounts, resolveMount } from './shared.js';
import { credentials } from '../credentials.js';
import { emitChange } from './watchers.js';
/**
 * Synchronous rename.
 * @param oldPath
 * @param newPath
 */
export function renameSync(oldPath, newPath) {
    oldPath = normalizePath(oldPath);
    newPath = normalizePath(newPath);
    const oldMount = resolveMount(oldPath);
    const newMount = resolveMount(newPath);
    if (!statSync(dirname(oldPath)).hasAccess(constants.W_OK, credentials)) {
        throw ErrnoError.With('EACCES', oldPath, 'rename');
    }
    try {
        if (oldMount === newMount) {
            oldMount.fs.renameSync(oldMount.path, newMount.path);
            emitChange('rename', oldPath.toString());
            return;
        }
        writeFileSync(newPath, readFileSync(oldPath));
        unlinkSync(oldPath);
        emitChange('rename', oldPath.toString());
    }
    catch (e) {
        throw fixError(e, { [oldMount.path]: oldPath, [newMount.path]: newPath });
    }
}
renameSync;
/**
 * Test whether or not the given path exists by checking with the file system.
 * @param path
 */
export function existsSync(path) {
    path = normalizePath(path);
    try {
        const { fs, path: resolvedPath } = resolveMount(realpathSync(path));
        return fs.existsSync(resolvedPath);
    }
    catch (e) {
        if (e.errno == Errno.ENOENT) {
            return false;
        }
        throw e;
    }
}
existsSync;
export function statSync(path, options) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(existsSync(path) ? realpathSync(path) : path);
    try {
        const stats = fs.statSync(resolved);
        if (!stats.hasAccess(constants.R_OK, credentials)) {
            throw ErrnoError.With('EACCES', path, 'stat');
        }
        return options?.bigint ? new BigIntStats(stats) : stats;
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
statSync;
export function lstatSync(path, options) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(path);
    try {
        const stats = fs.statSync(resolved);
        return options?.bigint ? new BigIntStats(stats) : stats;
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
lstatSync;
/**
 * Synchronous `truncate`.
 * @param path
 * @param len
 */
export function truncateSync(path, len = 0) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const file = __addDisposableResource(env_1, _openSync(path, 'r+'), false);
        len || (len = 0);
        if (len < 0) {
            throw new ErrnoError(Errno.EINVAL);
        }
        file.truncateSync(len);
    }
    catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
    }
    finally {
        __disposeResources(env_1);
    }
}
truncateSync;
/**
 * Synchronous `unlink`.
 * @param path
 */
export function unlinkSync(path) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(path);
    try {
        if (!fs.statSync(resolved).hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', resolved, 'unlink');
        }
        fs.unlinkSync(resolved);
        emitChange('rename', path.toString());
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
unlinkSync;
function _openSync(path, _flag, _mode, resolveSymlinks = true) {
    path = normalizePath(path);
    const mode = normalizeMode(_mode, 0o644), flag = parseFlag(_flag);
    path = resolveSymlinks && existsSync(path) ? realpathSync(path) : path;
    const { fs, path: resolved } = resolveMount(path);
    if (!fs.existsSync(resolved)) {
        if ((!isWriteable(flag) && !isAppendable(flag)) || flag == 'r+') {
            throw ErrnoError.With('ENOENT', path, '_open');
        }
        // Create the file
        const parentStats = fs.statSync(dirname(resolved));
        if (!parentStats.hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', dirname(path), '_open');
        }
        if (!parentStats.isDirectory()) {
            throw ErrnoError.With('ENOTDIR', dirname(path), '_open');
        }
        return fs.createFileSync(resolved, flag, mode);
    }
    const stats = fs.statSync(resolved);
    if (!stats.hasAccess(mode, credentials) || !stats.hasAccess(flagToMode(flag), credentials)) {
        throw ErrnoError.With('EACCES', path, '_open');
    }
    if (isExclusive(flag)) {
        throw ErrnoError.With('EEXIST', path, '_open');
    }
    const file = fs.openFileSync(resolved, flag);
    if (isTruncating(flag)) {
        file.truncateSync(0);
        file.syncSync();
    }
    return file;
}
/**
 * Synchronous file open.
 * @see http://www.manpagez.com/man/2/open/
 * @param flags Handles the complexity of the various file
 *   modes. See its API for more details.
 * @param mode Mode to use to open the file. Can be ignored if the
 *   filesystem doesn't support permissions.
 */
export function openSync(path, flag, mode = constants.F_OK) {
    return file2fd(_openSync(path, flag, mode, true));
}
openSync;
/**
 * Opens a file or symlink
 * @internal
 */
export function lopenSync(path, flag, mode) {
    return file2fd(_openSync(path, flag, mode, false));
}
/**
 * Synchronously reads the entire contents of a file.
 */
function _readFileSync(fname, flag, resolveSymlinks) {
    const env_2 = { stack: [], error: void 0, hasError: false };
    try {
        // Get file.
        const file = __addDisposableResource(env_2, _openSync(fname, flag, 0o644, resolveSymlinks), false);
        const stat = file.statSync();
        // Allocate buffer.
        const data = new Uint8Array(stat.size);
        file.readSync(data, 0, stat.size, 0);
        return data;
    }
    catch (e_2) {
        env_2.error = e_2;
        env_2.hasError = true;
    }
    finally {
        __disposeResources(env_2);
    }
}
export function readFileSync(path, _options = {}) {
    const options = normalizeOptions(_options, null, 'r', 0o644);
    const flag = parseFlag(options.flag);
    if (!isReadable(flag)) {
        throw new ErrnoError(Errno.EINVAL, 'Flag passed to readFile must allow for reading.');
    }
    const data = Buffer.from(_readFileSync(typeof path == 'number' ? fd2file(path).path : path.toString(), options.flag, true));
    return options.encoding ? data.toString(options.encoding) : data;
}
readFileSync;
export function writeFileSync(path, data, _options = {}) {
    const env_3 = { stack: [], error: void 0, hasError: false };
    try {
        const options = normalizeOptions(_options, 'utf8', 'w+', 0o644);
        const flag = parseFlag(options.flag);
        if (!isWriteable(flag)) {
            throw new ErrnoError(Errno.EINVAL, 'Flag passed to writeFile must allow for writing.');
        }
        if (typeof data != 'string' && !options.encoding) {
            throw new ErrnoError(Errno.EINVAL, 'Encoding not specified');
        }
        const encodedData = typeof data == 'string' ? Buffer.from(data, options.encoding) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        if (!encodedData) {
            throw new ErrnoError(Errno.EINVAL, 'Data not specified');
        }
        const file = __addDisposableResource(env_3, _openSync(typeof path == 'number' ? fd2file(path).path : path.toString(), flag, options.mode, true), false);
        file.writeSync(encodedData, 0, encodedData.byteLength, 0);
        emitChange('change', path.toString());
    }
    catch (e_3) {
        env_3.error = e_3;
        env_3.hasError = true;
    }
    finally {
        __disposeResources(env_3);
    }
}
writeFileSync;
/**
 * Asynchronously append data to a file, creating the file if it not yet
 * exists.
 *
 * @param filename
 * @param data
 * @param options
 * @option options encoding Defaults to `'utf8'`.
 * @option options mode Defaults to `0644`.
 * @option options flag Defaults to `'a'`.
 */
export function appendFileSync(filename, data, _options = {}) {
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
        const file = __addDisposableResource(env_4, _openSync(typeof filename == 'number' ? fd2file(filename).path : filename.toString(), flag, options.mode, true), false);
        file.writeSync(encodedData, 0, encodedData.byteLength);
    }
    catch (e_4) {
        env_4.error = e_4;
        env_4.hasError = true;
    }
    finally {
        __disposeResources(env_4);
    }
}
appendFileSync;
export function fstatSync(fd, options) {
    const stats = fd2file(fd).statSync();
    return options?.bigint ? new BigIntStats(stats) : stats;
}
fstatSync;
/**
 * Synchronous close.
 * @param fd
 */
export function closeSync(fd) {
    fd2file(fd).closeSync();
    fdMap.delete(fd);
}
closeSync;
/**
 * Synchronous ftruncate.
 * @param fd
 * @param len
 */
export function ftruncateSync(fd, len = 0) {
    len || (len = 0);
    if (len < 0) {
        throw new ErrnoError(Errno.EINVAL);
    }
    fd2file(fd).truncateSync(len);
}
ftruncateSync;
/**
 * Synchronous fsync.
 * @param fd
 */
export function fsyncSync(fd) {
    fd2file(fd).syncSync();
}
fsyncSync;
/**
 * Synchronous fdatasync.
 * @param fd
 */
export function fdatasyncSync(fd) {
    fd2file(fd).datasyncSync();
}
fdatasyncSync;
export function writeSync(fd, data, posOrOff, lenOrEnc, pos) {
    let buffer, offset, length, position;
    if (typeof data === 'string') {
        // Signature 1: (fd, string, [position?, [encoding?]])
        position = typeof posOrOff === 'number' ? posOrOff : null;
        const encoding = typeof lenOrEnc === 'string' ? lenOrEnc : 'utf8';
        offset = 0;
        buffer = Buffer.from(data, encoding);
        length = buffer.byteLength;
    }
    else {
        // Signature 2: (fd, buffer, offset, length, position?)
        buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        offset = posOrOff;
        length = lenOrEnc;
        position = typeof pos === 'number' ? pos : null;
    }
    const file = fd2file(fd);
    position ?? (position = file.position);
    const bytesWritten = file.writeSync(buffer, offset, length, position);
    emitChange('change', file.path);
    return bytesWritten;
}
writeSync;
export function readSync(fd, buffer, opts, length, position) {
    const file = fd2file(fd);
    const offset = typeof opts == 'object' ? opts.offset : opts;
    if (typeof opts == 'object') {
        length = opts.length;
        position = opts.position;
    }
    position = Number(position);
    if (isNaN(position)) {
        position = file.position;
    }
    return file.readSync(buffer, offset, length, position);
}
readSync;
/**
 * Synchronous `fchown`.
 * @param fd
 * @param uid
 * @param gid
 */
export function fchownSync(fd, uid, gid) {
    fd2file(fd).chownSync(uid, gid);
}
fchownSync;
/**
 * Synchronous `fchmod`.
 * @param fd
 * @param mode
 */
export function fchmodSync(fd, mode) {
    const numMode = normalizeMode(mode, -1);
    if (numMode < 0) {
        throw new ErrnoError(Errno.EINVAL, `Invalid mode.`);
    }
    fd2file(fd).chmodSync(numMode);
}
fchmodSync;
/**
 * Change the file timestamps of a file referenced by the supplied file
 * descriptor.
 * @param fd
 * @param atime
 * @param mtime
 */
export function futimesSync(fd, atime, mtime) {
    fd2file(fd).utimesSync(normalizeTime(atime), normalizeTime(mtime));
}
futimesSync;
/**
 * Synchronous `rmdir`.
 * @param path
 */
export function rmdirSync(path) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(existsSync(path) ? realpathSync(path) : path);
    try {
        if (!fs.statSync(resolved).hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', resolved, 'rmdir');
        }
        fs.rmdirSync(resolved);
        emitChange('rename', path.toString());
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
}
rmdirSync;
export function mkdirSync(path, options) {
    options = typeof options === 'object' ? options : { mode: options };
    const mode = normalizeMode(options?.mode, 0o777);
    path = normalizePath(path);
    path = existsSync(path) ? realpathSync(path) : path;
    const { fs, path: resolved } = resolveMount(path);
    const errorPaths = { [resolved]: path };
    try {
        if (!options?.recursive) {
            if (!fs.statSync(dirname(resolved)).hasAccess(constants.W_OK, credentials)) {
                throw ErrnoError.With('EACCES', dirname(resolved), 'mkdir');
            }
            return fs.mkdirSync(resolved, mode);
        }
        const dirs = [];
        for (let dir = resolved, original = path; !fs.existsSync(dir); dir = dirname(dir), original = dirname(original)) {
            dirs.unshift(dir);
            errorPaths[dir] = original;
        }
        for (const dir of dirs) {
            if (!fs.statSync(dirname(dir)).hasAccess(constants.W_OK, credentials)) {
                throw ErrnoError.With('EACCES', dirname(dir), 'mkdir');
            }
            fs.mkdirSync(dir, mode);
            emitChange('rename', dir);
        }
        return dirs[0];
    }
    catch (e) {
        throw fixError(e, errorPaths);
    }
}
mkdirSync;
export function readdirSync(path, options) {
    path = normalizePath(path);
    const { fs, path: resolved } = resolveMount(existsSync(path) ? realpathSync(path) : path);
    let entries;
    if (!statSync(path).hasAccess(constants.R_OK, credentials)) {
        throw ErrnoError.With('EACCES', path, 'readdir');
    }
    try {
        entries = fs.readdirSync(resolved);
    }
    catch (e) {
        throw fixError(e, { [resolved]: path });
    }
    for (const mount of mounts.keys()) {
        if (!mount.startsWith(path)) {
            continue;
        }
        const entry = mount.slice(path.length);
        if (entry.includes('/') || entry.length == 0) {
            // ignore FSs mounted in subdirectories and any FS mounted to `path`.
            continue;
        }
        entries.push(entry);
    }
    return entries.map((entry) => {
        if (typeof options == 'object' && options?.withFileTypes) {
            return new Dirent(entry, statSync(join(path.toString(), entry)));
        }
        if (options == 'buffer' || (typeof options == 'object' && options?.encoding == 'buffer')) {
            return Buffer.from(entry);
        }
        return entry;
    });
}
readdirSync;
// SYMLINK METHODS
/**
 * Synchronous `link`.
 * @param targetPath
 * @param linkPath
 */
export function linkSync(targetPath, linkPath) {
    targetPath = normalizePath(targetPath);
    if (!statSync(dirname(targetPath)).hasAccess(constants.R_OK, credentials)) {
        throw ErrnoError.With('EACCES', dirname(targetPath), 'link');
    }
    linkPath = normalizePath(linkPath);
    if (!statSync(dirname(linkPath)).hasAccess(constants.W_OK, credentials)) {
        throw ErrnoError.With('EACCES', dirname(linkPath), 'link');
    }
    const { fs, path } = resolveMount(targetPath);
    const link = resolveMount(linkPath);
    if (fs != link.fs) {
        throw ErrnoError.With('EXDEV', linkPath, 'link');
    }
    try {
        if (!fs.statSync(path).hasAccess(constants.W_OK, credentials)) {
            throw ErrnoError.With('EACCES', path, 'link');
        }
        return fs.linkSync(path, linkPath);
    }
    catch (e) {
        throw fixError(e, { [path]: targetPath, [link.path]: linkPath });
    }
}
linkSync;
/**
 * Synchronous `symlink`.
 * @param target target path
 * @param path link path
 * @param type can be either `'dir'` or `'file'` (default is `'file'`)
 */
export function symlinkSync(target, path, type = 'file') {
    if (!['file', 'dir', 'junction'].includes(type)) {
        throw new ErrnoError(Errno.EINVAL, 'Invalid type: ' + type);
    }
    if (existsSync(path)) {
        throw ErrnoError.With('EEXIST', path.toString(), 'symlink');
    }
    writeFileSync(path, target.toString());
    const file = _openSync(path, 'r+', 0o644, false);
    file._setTypeSync(constants.S_IFLNK);
}
symlinkSync;
export function readlinkSync(path, options) {
    const value = Buffer.from(_readFileSync(path.toString(), 'r', false));
    const encoding = typeof options == 'object' ? options?.encoding : options;
    if (encoding == 'buffer') {
        return value;
    }
    return value.toString(encoding);
}
readlinkSync;
// PROPERTY OPERATIONS
/**
 * Synchronous `chown`.
 * @param path
 * @param uid
 * @param gid
 */
export function chownSync(path, uid, gid) {
    const fd = openSync(path, 'r+');
    fchownSync(fd, uid, gid);
    closeSync(fd);
}
chownSync;
/**
 * Synchronous `lchown`.
 * @param path
 * @param uid
 * @param gid
 */
export function lchownSync(path, uid, gid) {
    const fd = lopenSync(path, 'r+');
    fchownSync(fd, uid, gid);
    closeSync(fd);
}
lchownSync;
/**
 * Synchronous `chmod`.
 * @param path
 * @param mode
 */
export function chmodSync(path, mode) {
    const fd = openSync(path, 'r+');
    fchmodSync(fd, mode);
    closeSync(fd);
}
chmodSync;
/**
 * Synchronous `lchmod`.
 * @param path
 * @param mode
 */
export function lchmodSync(path, mode) {
    const fd = lopenSync(path, 'r+');
    fchmodSync(fd, mode);
    closeSync(fd);
}
lchmodSync;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 */
export function utimesSync(path, atime, mtime) {
    const fd = openSync(path, 'r+');
    futimesSync(fd, atime, mtime);
    closeSync(fd);
}
utimesSync;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 */
export function lutimesSync(path, atime, mtime) {
    const fd = lopenSync(path, 'r+');
    futimesSync(fd, atime, mtime);
    closeSync(fd);
}
lutimesSync;
export function realpathSync(path, options) {
    path = normalizePath(path);
    const { base, dir } = parse(path);
    const lpath = join(dir == '/' ? '/' : realpathSync(dir), base);
    const { fs, path: resolvedPath, mountPoint } = resolveMount(lpath);
    try {
        const stats = fs.statSync(resolvedPath);
        if (!stats.isSymbolicLink()) {
            return lpath;
        }
        return realpathSync(mountPoint + readlinkSync(lpath, options).toString());
    }
    catch (e) {
        throw fixError(e, { [resolvedPath]: lpath });
    }
}
realpathSync;
/**
 * Synchronous `access`.
 * @param path
 * @param mode
 */
export function accessSync(path, mode = 0o600) {
    const stats = statSync(path);
    if (!stats.hasAccess(mode, credentials)) {
        throw new ErrnoError(Errno.EACCES);
    }
}
accessSync;
/**
 * Synchronous `rm`. Removes files or directories (recursively).
 * @param path The path to the file or directory to remove.
 */
export function rmSync(path, options) {
    path = normalizePath(path);
    const stats = statSync(path);
    switch (stats.mode & constants.S_IFMT) {
        case constants.S_IFDIR:
            if (options?.recursive) {
                for (const entry of readdirSync(path)) {
                    rmSync(join(path, entry), options);
                }
            }
            rmdirSync(path);
            return;
        case constants.S_IFREG:
        case constants.S_IFLNK:
            unlinkSync(path);
            return;
        case constants.S_IFBLK:
        case constants.S_IFCHR:
        case constants.S_IFIFO:
        case constants.S_IFSOCK:
        default:
            throw new ErrnoError(Errno.EPERM, 'File type not supported', path, 'rm');
    }
}
rmSync;
export function mkdtempSync(prefix, options) {
    const encoding = typeof options === 'object' ? options?.encoding : options || 'utf8';
    const fsName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const resolvedPath = '/tmp/' + fsName;
    mkdirSync(resolvedPath);
    return encoding == 'buffer' ? Buffer.from(resolvedPath) : resolvedPath;
}
mkdtempSync;
/**
 * Synchronous `copyFile`. Copies a file.
 * @param src The source file.
 * @param dest The destination file.
 * @param flags Optional flags for the copy operation. Currently supports these flags:
 *    * `fs.constants.COPYFILE_EXCL`: If the destination file already exists, the operation fails.
 */
export function copyFileSync(src, dest, flags) {
    src = normalizePath(src);
    dest = normalizePath(dest);
    if (flags && flags & constants.COPYFILE_EXCL && existsSync(dest)) {
        throw new ErrnoError(Errno.EEXIST, 'Destination file already exists.', dest, 'copyFile');
    }
    writeFileSync(dest, readFileSync(src));
    emitChange('rename', dest.toString());
}
copyFileSync;
/**
 * Synchronous `readv`. Reads from a file descriptor into multiple buffers.
 * @param fd The file descriptor.
 * @param buffers An array of Uint8Array buffers.
 * @param position The position in the file where to begin reading.
 * @returns The number of bytes read.
 */
export function readvSync(fd, buffers, position) {
    const file = fd2file(fd);
    let bytesRead = 0;
    for (const buffer of buffers) {
        bytesRead += file.readSync(buffer, 0, buffer.byteLength, position + bytesRead);
    }
    return bytesRead;
}
readvSync;
/**
 * Synchronous `writev`. Writes from multiple buffers into a file descriptor.
 * @param fd The file descriptor.
 * @param buffers An array of Uint8Array buffers.
 * @param position The position in the file where to begin writing.
 * @returns The number of bytes written.
 */
export function writevSync(fd, buffers, position) {
    const file = fd2file(fd);
    let bytesWritten = 0;
    for (const buffer of buffers) {
        bytesWritten += file.writeSync(new Uint8Array(buffer.buffer), 0, buffer.byteLength, position + bytesWritten);
    }
    return bytesWritten;
}
writevSync;
/**
 * Synchronous `opendir`. Opens a directory.
 * @param path The path to the directory.
 * @param options Options for opening the directory.
 * @returns A `Dir` object representing the opened directory.
 */
export function opendirSync(path, options) {
    path = normalizePath(path);
    return new Dir(path);
}
opendirSync;
/**
 * Synchronous `cp`. Recursively copies a file or directory.
 * @param source The source file or directory.
 * @param destination The destination file or directory.
 * @param opts Options for the copy operation. Currently supports these options from Node.js 'fs.cpSync':
 *   * `dereference`: Dereference symbolic links.
 *   * `errorOnExist`: Throw an error if the destination file or directory already exists.
 *   * `filter`: A function that takes a source and destination path and returns a boolean, indicating whether to copy the given source element.
 *   * `force`: Overwrite the destination if it exists, and overwrite existing readonly destination files.
 *   * `preserveTimestamps`: Preserve file timestamps.
 *   * `recursive`: If `true`, copies directories recursively.
 */
export function cpSync(source, destination, opts) {
    source = normalizePath(source);
    destination = normalizePath(destination);
    const srcStats = lstatSync(source); // Use lstat to follow symlinks if not dereferencing
    if (opts?.errorOnExist && existsSync(destination)) {
        throw new ErrnoError(Errno.EEXIST, 'Destination file or directory already exists.', destination, 'cp');
    }
    switch (srcStats.mode & constants.S_IFMT) {
        case constants.S_IFDIR:
            if (!opts?.recursive) {
                throw new ErrnoError(Errno.EISDIR, source + ' is a directory (not copied)', source, 'cp');
            }
            mkdirSync(destination, { recursive: true }); // Ensure the destination directory exists
            for (const dirent of readdirSync(source, { withFileTypes: true })) {
                if (opts.filter && !opts.filter(join(source, dirent.name), join(destination, dirent.name))) {
                    continue; // Skip if the filter returns false
                }
                cpSync(join(source, dirent.name), join(destination, dirent.name), opts);
            }
            break;
        case constants.S_IFREG:
        case constants.S_IFLNK:
            copyFileSync(source, destination);
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
        utimesSync(destination, srcStats.atime, srcStats.mtime);
    }
}
cpSync;
export function statfsSync(path, options) {
    path = normalizePath(path);
    const { fs } = resolveMount(path);
    return _statfs(fs, options?.bigint);
}
