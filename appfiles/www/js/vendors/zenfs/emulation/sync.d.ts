/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { Buffer } from 'buffer';
import type * as fs from 'node:fs';
import type { FileContents } from '../filesystem.js';
import { BigIntStats, type Stats } from '../stats.js';
import { Dir, Dirent } from './dir.js';
/**
 * Synchronous rename.
 * @param oldPath
 * @param newPath
 */
export declare function renameSync(oldPath: fs.PathLike, newPath: fs.PathLike): void;
/**
 * Test whether or not the given path exists by checking with the file system.
 * @param path
 */
export declare function existsSync(path: fs.PathLike): boolean;
/**
 * Synchronous `stat`.
 * @param path
 * @returns Stats
 */
export declare function statSync(path: fs.PathLike, options?: {
    bigint?: boolean;
}): Stats;
export declare function statSync(path: fs.PathLike, options: {
    bigint: true;
}): BigIntStats;
/**
 * Synchronous `lstat`.
 * `lstat()` is identical to `stat()`, except that if path is a symbolic link,
 * then the link itself is stat-ed, not the file that it refers to.
 * @param path
 */
export declare function lstatSync(path: fs.PathLike, options?: {
    bigint?: boolean;
}): Stats;
export declare function lstatSync(path: fs.PathLike, options: {
    bigint: true;
}): BigIntStats;
/**
 * Synchronous `truncate`.
 * @param path
 * @param len
 */
export declare function truncateSync(path: fs.PathLike, len?: number | null): void;
/**
 * Synchronous `unlink`.
 * @param path
 */
export declare function unlinkSync(path: fs.PathLike): void;
/**
 * Synchronous file open.
 * @see http://www.manpagez.com/man/2/open/
 * @param flags Handles the complexity of the various file
 *   modes. See its API for more details.
 * @param mode Mode to use to open the file. Can be ignored if the
 *   filesystem doesn't support permissions.
 */
export declare function openSync(path: fs.PathLike, flag: fs.OpenMode, mode?: fs.Mode | null): number;
/**
 * Opens a file or symlink
 * @internal
 */
export declare function lopenSync(path: fs.PathLike, flag: string, mode?: fs.Mode | null): number;
/**
 * Synchronously reads the entire contents of a file.
 * @param path
 * @param options
 * @option options encoding The string encoding for the file contents. Defaults to `null`.
 * @option options flag Defaults to `'r'`.
 * @returns file contents
 */
export declare function readFileSync(path: fs.PathOrFileDescriptor, options?: {
    flag?: string;
} | null): Buffer;
export declare function readFileSync(path: fs.PathOrFileDescriptor, options?: (fs.EncodingOption & {
    flag?: string;
}) | BufferEncoding | null): string;
/**
 * Synchronously writes data to a file, replacing the file if it already
 * exists.
 *
 * The encoding option is ignored if data is a buffer.
 * @param path
 * @param data
 * @param options
 * @option options encoding Defaults to `'utf8'`.
 * @option options mode Defaults to `0644`.
 * @option options flag Defaults to `'w'`.
 */
export declare function writeFileSync(path: fs.PathOrFileDescriptor, data: FileContents, options?: fs.WriteFileOptions): void;
export declare function writeFileSync(path: fs.PathOrFileDescriptor, data: FileContents, encoding?: BufferEncoding): void;
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
export declare function appendFileSync(filename: fs.PathOrFileDescriptor, data: FileContents, _options?: fs.WriteFileOptions): void;
/**
 * Synchronous `fstat`.
 * `fstat()` is identical to `stat()`, except that the file to be stat-ed is
 * specified by the file descriptor `fd`.
 * @param fd
 */
export declare function fstatSync(fd: number, options?: {
    bigint?: boolean;
}): Stats;
export declare function fstatSync(fd: number, options: {
    bigint: true;
}): BigIntStats;
/**
 * Synchronous close.
 * @param fd
 */
export declare function closeSync(fd: number): void;
/**
 * Synchronous ftruncate.
 * @param fd
 * @param len
 */
export declare function ftruncateSync(fd: number, len?: number | null): void;
/**
 * Synchronous fsync.
 * @param fd
 */
export declare function fsyncSync(fd: number): void;
/**
 * Synchronous fdatasync.
 * @param fd
 */
export declare function fdatasyncSync(fd: number): void;
/**
 * Write buffer to the file specified by `fd`.
 * Note that it is unsafe to use fs.write multiple times on the same file
 * without waiting for it to return.
 * @param fd
 * @param data Uint8Array containing the data to write to
 *   the file.
 * @param offset Offset in the buffer to start reading data from.
 * @param length The amount of bytes to write to the file.
 * @param position Offset from the beginning of the file where this
 *   data should be written. If position is null, the data will be written at
 *   the current position.
 */
export declare function writeSync(fd: number, data: ArrayBufferView, offset?: number | null, length?: number | null, position?: number | null): number;
export declare function writeSync(fd: number, data: string, position?: number | null, encoding?: BufferEncoding | null): number;
/**
 * Read data from the file specified by `fd`.
 * @param fd
 * @param buffer The buffer that the data will be
 *   written to.
 * @param offset The offset within the buffer where writing will
 *   start.
 * @param length An integer specifying the number of bytes to read.
 * @param position An integer specifying where to begin reading from
 *   in the file. If position is null, data will be read from the current file
 *   position.
 */
export declare function readSync(fd: number, buffer: ArrayBufferView, opts?: fs.ReadSyncOptions): number;
export declare function readSync(fd: number, buffer: ArrayBufferView, offset: number, length: number, position?: fs.ReadPosition | null): number;
/**
 * Synchronous `fchown`.
 * @param fd
 * @param uid
 * @param gid
 */
export declare function fchownSync(fd: number, uid: number, gid: number): void;
/**
 * Synchronous `fchmod`.
 * @param fd
 * @param mode
 */
export declare function fchmodSync(fd: number, mode: number | string): void;
/**
 * Change the file timestamps of a file referenced by the supplied file
 * descriptor.
 * @param fd
 * @param atime
 * @param mtime
 */
export declare function futimesSync(fd: number, atime: string | number | Date, mtime: string | number | Date): void;
/**
 * Synchronous `rmdir`.
 * @param path
 */
export declare function rmdirSync(path: fs.PathLike): void;
/**
 * Synchronous `mkdir`.
 * @param path
 * @param mode defaults to o777
 */
export declare function mkdirSync(path: fs.PathLike, options: fs.MakeDirectoryOptions & {
    recursive: true;
}): string | undefined;
export declare function mkdirSync(path: fs.PathLike, options?: fs.Mode | (fs.MakeDirectoryOptions & {
    recursive?: false;
}) | null): void;
export declare function mkdirSync(path: fs.PathLike, options?: fs.Mode | fs.MakeDirectoryOptions | null): string | undefined;
/**
 * Synchronous `readdir`. Reads the contents of a directory.
 * @param path
 */
export declare function readdirSync(path: fs.PathLike, options?: {
    recursive?: boolean;
    encoding?: BufferEncoding | null;
    withFileTypes?: false;
} | BufferEncoding | null): string[];
export declare function readdirSync(path: fs.PathLike, options: {
    recursive?: boolean;
    encoding: 'buffer';
    withFileTypes?: false;
} | 'buffer'): Buffer[];
export declare function readdirSync(path: fs.PathLike, options: {
    recursive?: boolean;
    withFileTypes: true;
}): Dirent[];
export declare function readdirSync(path: fs.PathLike, options?: (fs.ObjectEncodingOptions & {
    withFileTypes?: false;
    recursive?: boolean;
}) | BufferEncoding | null): string[] | Buffer[];
/**
 * Synchronous `link`.
 * @param targetPath
 * @param linkPath
 */
export declare function linkSync(targetPath: fs.PathLike, linkPath: fs.PathLike): void;
/**
 * Synchronous `symlink`.
 * @param target target path
 * @param path link path
 * @param type can be either `'dir'` or `'file'` (default is `'file'`)
 */
export declare function symlinkSync(target: fs.PathLike, path: fs.PathLike, type?: fs.symlink.Type | null): void;
/**
 * Synchronous readlink.
 * @param path
 */
export declare function readlinkSync(path: fs.PathLike, options?: fs.BufferEncodingOption): Buffer;
export declare function readlinkSync(path: fs.PathLike, options: fs.EncodingOption | BufferEncoding): string;
export declare function readlinkSync(path: fs.PathLike, options?: fs.EncodingOption | BufferEncoding | fs.BufferEncodingOption): Buffer | string;
/**
 * Synchronous `chown`.
 * @param path
 * @param uid
 * @param gid
 */
export declare function chownSync(path: fs.PathLike, uid: number, gid: number): void;
/**
 * Synchronous `lchown`.
 * @param path
 * @param uid
 * @param gid
 */
export declare function lchownSync(path: fs.PathLike, uid: number, gid: number): void;
/**
 * Synchronous `chmod`.
 * @param path
 * @param mode
 */
export declare function chmodSync(path: fs.PathLike, mode: fs.Mode): void;
/**
 * Synchronous `lchmod`.
 * @param path
 * @param mode
 */
export declare function lchmodSync(path: fs.PathLike, mode: number | string): void;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 */
export declare function utimesSync(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date): void;
/**
 * Change file timestamps of the file referenced by the supplied path.
 * @param path
 * @param atime
 * @param mtime
 */
export declare function lutimesSync(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date): void;
/**
 * Synchronous `realpath`.
 * @param path
 * @param cache An object literal of mapped paths that can be used to
 *   force a specific path resolution or avoid additional `fs.stat` calls for
 *   known real paths.
 * @returns the real path
 */
export declare function realpathSync(path: fs.PathLike, options: fs.BufferEncodingOption): Buffer;
export declare function realpathSync(path: fs.PathLike, options?: fs.EncodingOption): string;
/**
 * Synchronous `access`.
 * @param path
 * @param mode
 */
export declare function accessSync(path: fs.PathLike, mode?: number): void;
/**
 * Synchronous `rm`. Removes files or directories (recursively).
 * @param path The path to the file or directory to remove.
 */
export declare function rmSync(path: fs.PathLike, options?: fs.RmOptions): void;
/**
 * Synchronous `mkdtemp`. Creates a unique temporary directory.
 * @param prefix The directory prefix.
 * @param options The encoding (or an object including `encoding`).
 * @returns The path to the created temporary directory, encoded as a string or buffer.
 */
export declare function mkdtempSync(prefix: string, options: fs.BufferEncodingOption): Buffer;
export declare function mkdtempSync(prefix: string, options?: fs.EncodingOption): string;
/**
 * Synchronous `copyFile`. Copies a file.
 * @param src The source file.
 * @param dest The destination file.
 * @param flags Optional flags for the copy operation. Currently supports these flags:
 *    * `fs.constants.COPYFILE_EXCL`: If the destination file already exists, the operation fails.
 */
export declare function copyFileSync(src: fs.PathLike, dest: fs.PathLike, flags?: number): void;
/**
 * Synchronous `readv`. Reads from a file descriptor into multiple buffers.
 * @param fd The file descriptor.
 * @param buffers An array of Uint8Array buffers.
 * @param position The position in the file where to begin reading.
 * @returns The number of bytes read.
 */
export declare function readvSync(fd: number, buffers: readonly NodeJS.ArrayBufferView[], position?: number): number;
/**
 * Synchronous `writev`. Writes from multiple buffers into a file descriptor.
 * @param fd The file descriptor.
 * @param buffers An array of Uint8Array buffers.
 * @param position The position in the file where to begin writing.
 * @returns The number of bytes written.
 */
export declare function writevSync(fd: number, buffers: readonly ArrayBufferView[], position?: number): number;
/**
 * Synchronous `opendir`. Opens a directory.
 * @param path The path to the directory.
 * @param options Options for opening the directory.
 * @returns A `Dir` object representing the opened directory.
 */
export declare function opendirSync(path: fs.PathLike, options?: fs.OpenDirOptions): Dir;
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
export declare function cpSync(source: fs.PathLike, destination: fs.PathLike, opts?: fs.CopySyncOptions): void;
/**
 * Synchronous statfs(2). Returns information about the mounted file system which contains path.
 * In case of an error, the err.code will be one of Common System Errors.
 * @param path A path to an existing file or directory on the file system to be queried.
 * @param callback
 */
export declare function statfsSync(path: fs.PathLike, options?: fs.StatFsOptions & {
    bigint?: false;
}): fs.StatsFs;
export declare function statfsSync(path: fs.PathLike, options: fs.StatFsOptions & {
    bigint: true;
}): fs.BigIntStatsFs;
export declare function statfsSync(path: fs.PathLike, options?: fs.StatFsOptions): fs.StatsFs | fs.BigIntStatsFs;
