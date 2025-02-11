/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { Buffer } from 'buffer';
import type * as fs from 'node:fs';
import type { FileContents } from '../filesystem.js';
import { BigIntStats, type Stats } from '../stats.js';
import { type Callback } from '../utils.js';
import type { Dirent } from './dir.js';
import type { Dir } from './dir.js';
import * as promises from './promises.js';
import { ReadStream, WriteStream } from './streams.js';
import { FSWatcher } from './watchers.js';
/**
 * Asynchronous rename. No arguments other than a possible exception are given
 * to the completion callback.
 * @param oldPath
 * @param newPath
 * @param callback
 */
export declare function rename(oldPath: fs.PathLike, newPath: fs.PathLike, cb?: Callback): void;
/**
 * Test whether or not the given path exists by checking with the file system.
 * Then call the callback argument with either true or false.
 * @param path
 * @param callback
 * @deprecated Use {@link stat} or {@link access} instead.
 */
export declare function exists(path: fs.PathLike, cb?: (exists: boolean) => unknown): void;
/**
 * Asynchronous `stat`.
 * @param path
 * @param callback
 */
export declare function stat(path: fs.PathLike, callback: Callback<[Stats]>): void;
export declare function stat(path: fs.PathLike, options: {
    bigint?: false;
}, callback: Callback<[Stats]>): void;
export declare function stat(path: fs.PathLike, options: {
    bigint: true;
}, callback: Callback<[BigIntStats]>): void;
export declare function stat(path: fs.PathLike, options: fs.StatOptions, callback: Callback<[Stats] | [BigIntStats]>): void;
/**
 * Asynchronous `lstat`.
 * `lstat()` is identical to `stat()`, except that if path is a symbolic link,
 * then the link itself is stat-ed, not the file that it refers to.
 * @param path
 * @param callback
 */
export declare function lstat(path: fs.PathLike, callback: Callback<[Stats]>): void;
export declare function lstat(path: fs.PathLike, options: fs.StatOptions & {
    bigint?: false;
}, callback: Callback<[Stats]>): void;
export declare function lstat(path: fs.PathLike, options: fs.StatOptions & {
    bigint: true;
}, callback: Callback<[BigIntStats]>): void;
export declare function lstat(path: fs.PathLike, options: fs.StatOptions, callback: Callback<[Stats | BigIntStats]>): void;
/**
 * Asynchronous `truncate`.
 * @param path
 * @param len
 * @param callback
 */
export declare function truncate(path: fs.PathLike, cb?: Callback): void;
export declare function truncate(path: fs.PathLike, len: number, cb?: Callback): void;
/**
 * Asynchronous `unlink`.
 * @param path
 * @param callback
 */
export declare function unlink(path: fs.PathLike, cb?: Callback): void;
/**
 * Asynchronous file open.
 * Exclusive mode ensures that path is newly created.
 *
 * `flags` can be:
 *
 * * `'r'` - Open file for reading. An exception occurs if the file does not exist.
 * * `'r+'` - Open file for reading and writing. An exception occurs if the file does not exist.
 * * `'rs'` - Open file for reading in synchronous mode. Instructs the filesystem to not cache writes.
 * * `'rs+'` - Open file for reading and writing, and opens the file in synchronous mode.
 * * `'w'` - Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
 * * `'wx'` - Like 'w' but opens the file in exclusive mode.
 * * `'w+'` - Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
 * * `'wx+'` - Like 'w+' but opens the file in exclusive mode.
 * * `'a'` - Open file for appending. The file is created if it does not exist.
 * * `'ax'` - Like 'a' but opens the file in exclusive mode.
 * * `'a+'` - Open file for reading and appending. The file is created if it does not exist.
 * * `'ax+'` - Like 'a+' but opens the file in exclusive mode.
 *
 * @see http://www.manpagez.com/man/2/open/
 * @param path
 * @param flags
 * @param mode defaults to `0644`
 * @param callback
 */
export declare function open(path: fs.PathLike, flag: string, cb?: Callback<[number]>): void;
export declare function open(path: fs.PathLike, flag: string, mode: number | string, cb?: Callback<[number]>): void;
/**
 * Asynchronously reads the entire contents of a file.
 * @param filename
 * @param options
 * @option options encoding The string encoding for the file contents. Defaults to `null`.
 * @option options flag Defaults to `'r'`.
 * @param callback If no encoding is specified, then the raw buffer is returned.
 */
export declare function readFile(filename: fs.PathLike, cb: Callback<[Uint8Array]>): void;
export declare function readFile(filename: fs.PathLike, options: {
    flag?: string;
}, callback?: Callback<[Uint8Array]>): void;
export declare function readFile(filename: fs.PathLike, options: {
    encoding: BufferEncoding;
    flag?: string;
} | BufferEncoding, cb: Callback<[string]>): void;
/**
 * Asynchronously writes data to a file, replacing the file if it already
 * exists.
 *
 * The encoding option is ignored if data is a buffer.
 *
 * @param filename
 * @param data
 * @param options
 * @option encoding Defaults to `'utf8'`.
 * @option mode Defaults to `0644`.
 * @option flag Defaults to `'w'`.
 * @param callback
 */
export declare function writeFile(filename: fs.PathLike, data: FileContents, cb?: Callback): void;
export declare function writeFile(filename: fs.PathLike, data: FileContents, encoding?: BufferEncoding, cb?: Callback): void;
export declare function writeFile(filename: fs.PathLike, data: FileContents, options?: fs.WriteFileOptions, cb?: Callback): void;
/**
 * Asynchronously append data to a file, creating the file if it not yet
 * exists.
 *
 * @param filename
 * @param data
 * @param options
 * @option encoding Defaults to `'utf8'`.
 * @option mode Defaults to `0644`.
 * @option flag Defaults to `'a'`.
 * @param callback
 */
export declare function appendFile(filename: fs.PathLike, data: FileContents, cb?: Callback): void;
export declare function appendFile(filename: fs.PathLike, data: FileContents, options?: fs.EncodingOption & {
    mode?: fs.Mode;
    flag?: fs.OpenMode;
}, cb?: Callback): void;
export declare function appendFile(filename: fs.PathLike, data: FileContents, encoding?: BufferEncoding, cb?: Callback): void;
/**
 * Asynchronous `fstat`.
 * `fstat()` is identical to `stat()`, except that the file to be stat-ed is
 * specified by the file descriptor `fd`.
 * @param fd
 * @param callback
 */
export declare function fstat(fd: number, cb: Callback<[Stats]>): void;
export declare function fstat(fd: number, options: fs.StatOptions & {
    bigint?: false;
}, cb: Callback<[Stats]>): void;
export declare function fstat(fd: number, options: fs.StatOptions & {
    bigint: true;
}, cb: Callback<[BigIntStats]>): void;
/**
 * Asynchronous close.
 * @param fd
 * @param callback
 */
export declare function close(fd: number, cb?: Callback): void;
/**
 * Asynchronous ftruncate.
 * @param fd
 * @param len
 * @param callback
 */
export declare function ftruncate(fd: number, cb?: Callback): void;
export declare function ftruncate(fd: number, len?: number, cb?: Callback): void;
/**
 * Asynchronous fsync.
 * @param fd
 * @param callback
 */
export declare function fsync(fd: number, cb?: Callback): void;
/**
 * Asynchronous fdatasync.
 * @param fd
 * @param callback
 */
export declare function fdatasync(fd: number, cb?: Callback): void;
/**
 * Write buffer to the file specified by `fd`.
 * Note that it is unsafe to use fs.write multiple times on the same file
 * without waiting for the callback.
 * @param fd
 * @param buffer Uint8Array containing the data to write to
 *   the file.
 * @param offset Offset in the buffer to start reading data from.
 * @param length The amount of bytes to write to the file.
 * @param position Offset from the beginning of the file where this
 *   data should be written. If position is null, the data will be written at
 *   the current position.
 * @param callback The number specifies the number of bytes written into the file.
 */
export declare function write(fd: number, buffer: Uint8Array, offset: number, length: number, cb?: Callback<[number, Uint8Array]>): void;
export declare function write(fd: number, buffer: Uint8Array, offset: number, length: number, position?: number, cb?: Callback<[number, Uint8Array]>): void;
export declare function write(fd: number, data: FileContents, cb?: Callback<[number, string]>): void;
export declare function write(fd: number, data: FileContents, position?: number, cb?: Callback<[number, string]>): void;
export declare function write(fd: number, data: FileContents, position: number | null, encoding: BufferEncoding, cb?: Callback<[number, string]>): void;
/**
 * Read data from the file specified by `fd`.
 * @param buffer The buffer that the data will be
 *   written to.
 * @param offset The offset within the buffer where writing will
 *   start.
 * @param length An integer specifying the number of bytes to read.
 * @param position An integer specifying where to begin reading from
 *   in the file. If position is null, data will be read from the current file
 *   position.
 * @param callback The number is the number of bytes read
 */
export declare function read(fd: number, buffer: Uint8Array, offset: number, length: number, position?: number, cb?: Callback<[number, Uint8Array]>): void;
/**
 * Asynchronous `fchown`.
 * @param fd
 * @param uid
 * @param gid
 * @param callback
 */
export declare function fchown(fd: number, uid: number, gid: number, cb?: Callback): void;
/**
 * Asynchronous `fchmod`.
 * @param fd
 * @param mode
 * @param callback
 */
export declare function fchmod(fd: number, mode: string | number, cb: Callback): void;
/**
 * Change the file timestamps of a file referenced by the supplied file
 * descriptor.
 * @param fd
 * @param atime
 * @param mtime
 * @param callback
 */
export declare function futimes(fd: number, atime: number | Date, mtime: number | Date, cb?: Callback): void;
/**
 * Asynchronous `rmdir`.
 * @param path
 * @param callback
 */
export declare function rmdir(path: fs.PathLike, cb?: Callback): void;
/**
 * Asynchronous `mkdir`.
 * @param path
 * @param mode defaults to `0777`
 * @param callback
 */
export declare function mkdir(path: fs.PathLike, mode?: fs.Mode, cb?: Callback): void;
/**
 * Asynchronous `readdir`. Reads the contents of a directory.
 * The callback gets two arguments `(err, files)` where `files` is an array of
 * the names of the files in the directory excluding `'.'` and `'..'`.
 * @param path
 * @param callback
 */
export declare function readdir(path: fs.PathLike, cb: Callback<[string[]]>): void;
export declare function readdir(path: fs.PathLike, options: {
    withFileTypes?: false;
}, cb: Callback<[string[]]>): void;
export declare function readdir(path: fs.PathLike, options: {
    withFileTypes: true;
}, cb: Callback<[Dirent[]]>): void;
/**
 * Asynchronous `link`.
 * @param existing
 * @param newpath
 * @param callback
 */
export declare function link(existing: fs.PathLike, newpath: fs.PathLike, cb?: Callback): void;
/**
 * Asynchronous `symlink`.
 * @param target target path
 * @param path link path
 * @param type can be either `'dir'` or `'file'` (default is `'file'`)
 * @param callback
 */
export declare function symlink(target: fs.PathLike, path: fs.PathLike, cb?: Callback): void;
export declare function symlink(target: fs.PathLike, path: fs.PathLike, type?: fs.symlink.Type, cb?: Callback): void;
/**
 * Asynchronous readlink.
 * @param path
 * @param callback
 */
export declare function readlink(path: fs.PathLike, callback: Callback<[string]> & any): void;
export declare function readlink(path: fs.PathLike, options: fs.BufferEncodingOption, callback: Callback<[Uint8Array]>): void;
export declare function readlink(path: fs.PathLike, options: fs.EncodingOption, callback: Callback<[string | Uint8Array]>): void;
export declare function readlink(path: fs.PathLike, options: fs.EncodingOption, callback: Callback<[string]>): void;
/**
 * Asynchronous `chown`.
 * @param path
 * @param uid
 * @param gid
 * @param callback
 */
export declare function chown(path: fs.PathLike, uid: number, gid: number, cb?: Callback): void;
/**
 * Asynchronous `lchown`.
 * @param path
 * @param uid
 * @param gid
 * @param callback
 */
export declare function lchown(path: fs.PathLike, uid: number, gid: number, cb?: Callback): void;
/**
 * Asynchronous `chmod`.
 * @param path
 * @param mode
 * @param callback
 */
export declare function chmod(path: fs.PathLike, mode: number | string, cb?: Callback): void;
/**
 * Asynchronous `lchmod`.
 * @param path
 * @param mode
 * @param callback
 */
export declare function lchmod(path: fs.PathLike, mode: number | string, cb?: Callback): void;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 * @param callback
 */
export declare function utimes(path: fs.PathLike, atime: number | Date, mtime: number | Date, cb?: Callback): void;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 * @param callback
 */
export declare function lutimes(path: fs.PathLike, atime: number | Date, mtime: number | Date, cb?: Callback): void;
/**
 * Asynchronous `realpath`. The callback gets two arguments
 * `(err, resolvedPath)`. May use `process.cwd` to resolve relative paths.
 *
 * @param path
 * @param callback
 */
export declare function realpath(path: fs.PathLike, cb?: Callback<[string]>): void;
export declare function realpath(path: fs.PathLike, options: fs.EncodingOption, cb: Callback<[string]>): void;
/**
 * Asynchronous `access`.
 * @param path
 * @param mode
 * @param callback
 */
export declare function access(path: fs.PathLike, cb: Callback): void;
export declare function access(path: fs.PathLike, mode: number, cb: Callback): void;
/**
 * Watch for changes on a file. The callback listener will be called each time the file is accessed.
 *
 * The `options` argument may be omitted. If provided, it should be an object with a `persistent` boolean and an `interval` number specifying the polling interval in milliseconds.
 *
 * When a change is detected, the `listener` callback is called with the current and previous `Stats` objects.
 *
 * @param path The path to the file to watch.
 * @param options Optional options object specifying `persistent` and `interval`.
 * @param listener The callback listener to be called when the file changes.
 */
export declare function watchFile(path: fs.PathLike, listener: (curr: Stats, prev: Stats) => void): void;
export declare function watchFile(path: fs.PathLike, options: {
    persistent?: boolean;
    interval?: number;
}, listener: (curr: Stats, prev: Stats) => void): void;
/**
 * Stop watching for changes on a file.
 *
 * If the `listener` is specified, only that particular listener is removed.
 * If no `listener` is specified, all listeners are removed, and the file is no longer watched.
 *
 * @param path The path to the file to stop watching.
 * @param listener Optional listener to remove.
 */
export declare function unwatchFile(path: fs.PathLike, listener?: (curr: Stats, prev: Stats) => void): void;
export declare function watch(path: fs.PathLike, listener?: (event: string, filename: string) => any): FSWatcher;
export declare function watch(path: fs.PathLike, options: {
    persistent?: boolean;
}, listener?: (event: string, filename: string) => any): FSWatcher;
interface StreamOptions {
    flags?: string;
    encoding?: BufferEncoding;
    fd?: number | promises.FileHandle;
    mode?: number;
    autoClose?: boolean;
    emitClose?: boolean;
    start?: number;
    signal?: AbortSignal;
    highWaterMark?: number;
}
interface FSImplementation {
    open?: (...args: unknown[]) => unknown;
    close?: (...args: unknown[]) => unknown;
}
interface ReadStreamOptions extends StreamOptions {
    fs?: FSImplementation & {
        read: (...args: unknown[]) => unknown;
    };
    end?: number;
}
interface WriteStreamOptions extends StreamOptions {
    fs?: FSImplementation & {
        write: (...args: unknown[]) => unknown;
        writev?: (...args: unknown[]) => unknown;
    };
    flush?: boolean;
}
/**
 * Opens a file in read mode and creates a Node.js-like ReadStream.
 *
 * @param path The path to the file to be opened.
 * @param options Options for the ReadStream and file opening (e.g., `encoding`, `highWaterMark`, `mode`).
 * @returns A ReadStream object for interacting with the file's contents.
 */
export declare function createReadStream(path: fs.PathLike, _options?: BufferEncoding | ReadStreamOptions): ReadStream;
/**
 * Opens a file in write mode and creates a Node.js-like WriteStream.
 *
 * @param path The path to the file to be opened.
 * @param options Options for the WriteStream and file opening (e.g., `encoding`, `highWaterMark`, `mode`).
 * @returns A WriteStream object for writing to the file.
 */
export declare function createWriteStream(path: fs.PathLike, _options?: BufferEncoding | WriteStreamOptions): WriteStream;
export declare function rm(path: fs.PathLike, callback: Callback): void;
export declare function rm(path: fs.PathLike, options: fs.RmOptions, callback: Callback): void;
/**
 * Asynchronously creates a unique temporary directory.
 * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
 */
export declare function mkdtemp(prefix: string, callback: Callback<[string]>): void;
export declare function mkdtemp(prefix: string, options: fs.EncodingOption, callback: Callback<[string]>): void;
export declare function mkdtemp(prefix: string, options: fs.BufferEncodingOption, callback: Callback<[Buffer]>): void;
export declare function copyFile(src: fs.PathLike, dest: fs.PathLike, callback: Callback): void;
export declare function copyFile(src: fs.PathLike, dest: fs.PathLike, flags: number, callback: Callback): void;
type readvCb = Callback<[number, NodeJS.ArrayBufferView[]]>;
export declare function readv(fd: number, buffers: NodeJS.ArrayBufferView[], cb: readvCb): void;
export declare function readv(fd: number, buffers: NodeJS.ArrayBufferView[], position: number, cb: readvCb): void;
type writevCb = Callback<[number, NodeJS.ArrayBufferView[]]>;
export declare function writev(fd: number, buffers: Uint8Array[], cb: writevCb): void;
export declare function writev(fd: number, buffers: Uint8Array[], position: number, cb: writevCb): void;
export declare function opendir(path: fs.PathLike, cb: Callback<[Dir]>): void;
export declare function opendir(path: fs.PathLike, options: fs.OpenDirOptions, cb: Callback<[Dir]>): void;
export declare function cp(source: fs.PathLike, destination: fs.PathLike, callback: Callback): void;
export declare function cp(source: fs.PathLike, destination: fs.PathLike, opts: fs.CopyOptions, callback: Callback): void;
export declare function statfs(path: fs.PathLike, callback: Callback<[fs.StatsFs]>): void;
export declare function statfs(path: fs.PathLike, options: fs.StatFsOptions & {
    bigint?: false;
}, callback: Callback<[fs.StatsFs]>): void;
export declare function statfs(path: fs.PathLike, options: fs.StatFsOptions & {
    bigint: true;
}, callback: Callback<[fs.BigIntStatsFs]>): void;
export declare function openAsBlob(path: fs.PathLike, options?: fs.OpenAsBlobOptions): Promise<Blob>;
export {};
