/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import type { FileReadResult } from 'node:fs/promises';
import type { ExtractProperties } from 'utilium';
import { type MountConfiguration } from '../../config.js';
import { File } from '../../file.js';
import { FileSystem, type FileSystemMetadata } from '../../filesystem.js';
import { Stats, type FileType } from '../../stats.js';
import type { Backend, FilesystemOf } from '../backend.js';
import * as RPC from './rpc.js';
type FileMethods = Omit<ExtractProperties<File, (...args: any[]) => Promise<any>>, typeof Symbol.asyncDispose>;
type FileMethod = keyof FileMethods;
interface FileRequest<TMethod extends FileMethod = FileMethod> extends RPC.Request {
    fd: number;
    scope: 'file';
    method: TMethod;
    args: Parameters<FileMethods[TMethod]>;
}
export declare class PortFile extends File {
    readonly fs: PortFS;
    readonly fd: number;
    readonly path: string;
    position: number;
    constructor(fs: PortFS, fd: number, path: string, position: number);
    rpc<const T extends FileMethod>(method: T, ...args: Parameters<FileMethods[T]>): Promise<Awaited<ReturnType<FileMethods[T]>>>;
    protected _throwNoSync(syscall: string): never;
    stat(): Promise<Stats>;
    statSync(): Stats;
    truncate(len: number): Promise<void>;
    truncateSync(): void;
    write(buffer: Uint8Array, offset?: number, length?: number, position?: number): Promise<number>;
    writeSync(): number;
    read<TBuffer extends NodeJS.ArrayBufferView>(buffer: TBuffer, offset?: number, length?: number, position?: number): Promise<FileReadResult<TBuffer>>;
    readSync(): number;
    chown(uid: number, gid: number): Promise<void>;
    chownSync(): void;
    chmod(mode: number): Promise<void>;
    chmodSync(): void;
    utimes(atime: Date, mtime: Date): Promise<void>;
    utimesSync(): void;
    _setType(type: FileType): Promise<void>;
    _setTypeSync(): void;
    close(): Promise<void>;
    closeSync(): void;
    sync(): Promise<void>;
    syncSync(): void;
}
type FSMethods = ExtractProperties<FileSystem, (...args: any[]) => Promise<any> | FileSystemMetadata>;
type FSMethod = keyof FSMethods;
interface FSRequest<TMethod extends FSMethod = FSMethod> extends RPC.Request {
    scope: 'fs';
    method: TMethod;
    args: Parameters<FSMethods[TMethod]>;
}
declare const PortFS_base: import("../../mixins/shared.js").Mixin<typeof FileSystem, {
    _sync?: FileSystem | undefined;
    queueDone(): Promise<void>;
    ready(): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    statSync(path: string): Stats;
    createFileSync(path: string, flag: string, mode: number): File;
    openFileSync(path: string, flag: string): File;
    unlinkSync(path: string): void;
    rmdirSync(path: string): void;
    mkdirSync(path: string, mode: number): void;
    readdirSync(path: string): string[];
    linkSync(srcpath: string, dstpath: string): void;
    syncSync(path: string, data: Uint8Array, stats: Readonly<Stats>): void;
}>;
/**
 * PortFS lets you access a ZenFS instance that is running in a port, or the other way around.
 *
 * Note that synchronous operations are not permitted on the PortFS, regardless
 * of the configuration option of the remote FS.
 */
export declare class PortFS extends PortFS_base {
    readonly options: RPC.Options;
    readonly port: RPC.Port;
    /**
     * @hidden
     */
    _sync: import("../store/fs.js").StoreFS<import("../memory.js").InMemoryStore>;
    /**
     * Constructs a new PortFS instance that connects with ZenFS running on
     * the specified port.
     */
    constructor(options: RPC.Options);
    metadata(): FileSystemMetadata;
    protected rpc<const T extends FSMethod>(method: T, ...args: Parameters<FSMethods[T]>): Promise<Awaited<ReturnType<FSMethods[T]>>>;
    ready(): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    stat(path: string): Promise<Stats>;
    sync(path: string, data: Uint8Array, stats: Readonly<Stats>): Promise<void>;
    openFile(path: string, flag: string): Promise<File>;
    createFile(path: string, flag: string, mode: number): Promise<File>;
    unlink(path: string): Promise<void>;
    rmdir(path: string): Promise<void>;
    mkdir(path: string, mode: number): Promise<void>;
    readdir(path: string): Promise<string[]>;
    exists(path: string): Promise<boolean>;
    link(srcpath: string, dstpath: string): Promise<void>;
}
/**
 * @internal
 */
export type FileOrFSRequest = FSRequest | FileRequest;
/**
 * @internal
 */
export declare function handleRequest(port: RPC.Port, fs: FileSystem, request: FileOrFSRequest): Promise<void>;
export declare function attachFS(port: RPC.Port, fs: FileSystem): void;
export declare function detachFS(port: RPC.Port, fs: FileSystem): void;
export declare const _Port: {
    name: string;
    options: {
        port: {
            type: "object";
            required: true;
            description: string;
            validator(port: RPC.Port): void;
        };
        timeout: {
            type: "number";
            required: false;
            description: string;
        };
    };
    isAvailable(): Promise<boolean>;
    create(options: RPC.Options): PortFS;
};
type _port = typeof _Port;
interface Port extends _port {
}
export declare const Port: Port;
export declare function resolveRemoteMount<T extends Backend>(port: RPC.Port, config: MountConfiguration<T>, _depth?: number): Promise<FilesystemOf<T>>;
export {};
