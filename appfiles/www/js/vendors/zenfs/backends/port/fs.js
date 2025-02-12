import { resolveMountConfig } from '../../config.js';
import { Errno, ErrnoError } from '../../error.js';
import { File } from '../../file.js';
import { FileSystem } from '../../filesystem.js';
import { Async } from '../../mixins/async.js';
import { Stats } from '../../stats.js';
import { InMemory } from '../memory.js';
import * as RPC from './rpc.js';
export class PortFile extends File {
    constructor(fs, fd, path, position) {
        super();
        this.fs = fs;
        this.fd = fd;
        this.path = path;
        this.position = position;
    }
    rpc(method, ...args) {
        return RPC.request({
            scope: 'file',
            fd: this.fd,
            method,
            args,
        }, this.fs.options);
    }
    _throwNoSync(syscall) {
        throw new ErrnoError(Errno.ENOTSUP, 'Syncrohnous operations not support on PortFile', this.path, syscall);
    }
    async stat() {
        return new Stats(await this.rpc('stat'));
    }
    statSync() {
        this._throwNoSync('stat');
    }
    truncate(len) {
        return this.rpc('truncate', len);
    }
    truncateSync() {
        this._throwNoSync('truncate');
    }
    write(buffer, offset, length, position) {
        return this.rpc('write', buffer, offset, length, position);
    }
    writeSync() {
        this._throwNoSync('write');
    }
    async read(buffer, offset, length, position) {
        const result = await this.rpc('read', buffer, offset, length, position);
        return result;
    }
    readSync() {
        this._throwNoSync('read');
    }
    chown(uid, gid) {
        return this.rpc('chown', uid, gid);
    }
    chownSync() {
        this._throwNoSync('chown');
    }
    chmod(mode) {
        return this.rpc('chmod', mode);
    }
    chmodSync() {
        this._throwNoSync('chmod');
    }
    utimes(atime, mtime) {
        return this.rpc('utimes', atime, mtime);
    }
    utimesSync() {
        this._throwNoSync('utimes');
    }
    _setType(type) {
        return this.rpc('_setType', type);
    }
    _setTypeSync() {
        this._throwNoSync('_setType');
    }
    close() {
        return this.rpc('close');
    }
    closeSync() {
        this._throwNoSync('close');
    }
    sync() {
        return this.rpc('sync');
    }
    syncSync() {
        this._throwNoSync('sync');
    }
}
/**
 * PortFS lets you access a ZenFS instance that is running in a port, or the other way around.
 *
 * Note that synchronous operations are not permitted on the PortFS, regardless
 * of the configuration option of the remote FS.
 */
export class PortFS extends Async(FileSystem) {
    /**
     * Constructs a new PortFS instance that connects with ZenFS running on
     * the specified port.
     */
    constructor(options) {
        super();
        this.options = options;
        /**
         * @hidden
         */
        this._sync = InMemory.create({ name: 'port-tmpfs' });
        this.port = options.port;
        RPC.attach(this.port, RPC.handleResponse);
    }
    metadata() {
        return {
            ...super.metadata(),
            name: 'PortFS',
        };
    }
    rpc(method, ...args) {
        return RPC.request({
            scope: 'fs',
            method,
            args,
        }, { ...this.options, fs: this });
    }
    async ready() {
        await this.rpc('ready');
        await super.ready();
    }
    rename(oldPath, newPath) {
        return this.rpc('rename', oldPath, newPath);
    }
    async stat(path) {
        return new Stats(await this.rpc('stat', path));
    }
    sync(path, data, stats) {
        return this.rpc('sync', path, data, stats);
    }
    openFile(path, flag) {
        return this.rpc('openFile', path, flag);
    }
    createFile(path, flag, mode) {
        return this.rpc('createFile', path, flag, mode);
    }
    unlink(path) {
        return this.rpc('unlink', path);
    }
    rmdir(path) {
        return this.rpc('rmdir', path);
    }
    mkdir(path, mode) {
        return this.rpc('mkdir', path, mode);
    }
    readdir(path) {
        return this.rpc('readdir', path);
    }
    exists(path) {
        return this.rpc('exists', path);
    }
    link(srcpath, dstpath) {
        return this.rpc('link', srcpath, dstpath);
    }
}
let nextFd = 0;
const descriptors = new Map();
/**
 * @internal
 */
export async function handleRequest(port, fs, request) {
    if (!RPC.isMessage(request)) {
        return;
    }
    const { method, args, id, scope, stack } = request;
    let value, error = false;
    try {
        switch (scope) {
            case 'fs':
                // @ts-expect-error 2556
                value = await fs[method](...args);
                if (value instanceof File) {
                    descriptors.set(++nextFd, value);
                    value = {
                        fd: nextFd,
                        path: value.path,
                        position: value.position,
                    };
                }
                break;
            case 'file':
                const { fd } = request;
                if (!descriptors.has(fd)) {
                    throw new ErrnoError(Errno.EBADF);
                }
                // @ts-expect-error 2556
                value = await descriptors.get(fd)[method](...args);
                if (method == 'close') {
                    descriptors.delete(fd);
                }
                break;
            default:
                return;
        }
    }
    catch (e) {
        value = e instanceof ErrnoError ? e.toJSON() : e.toString();
        error = true;
    }
    port.postMessage({ _zenfs: true, scope, id, error, method, stack, value });
}
export function attachFS(port, fs) {
    RPC.attach(port, request => handleRequest(port, fs, request));
}
export function detachFS(port, fs) {
    RPC.detach(port, request => handleRequest(port, fs, request));
}
export const _Port = {
    name: 'Port',
    options: {
        port: {
            type: 'object',
            required: true,
            description: 'The target port that you want to connect to',
            validator(port) {
                // Check for a `postMessage` function.
                if (typeof port?.postMessage != 'function') {
                    throw new ErrnoError(Errno.EINVAL, 'option must be a port.');
                }
            },
        },
        timeout: {
            type: 'number',
            required: false,
            description: 'How long to wait before the request times out',
        },
    },
    async isAvailable() {
        return true;
    },
    create(options) {
        return new PortFS(options);
    },
};
export const Port = _Port;
export async function resolveRemoteMount(port, config, _depth = 0) {
    const stopAndReplay = RPC.catchMessages(port);
    const fs = await resolveMountConfig(config, _depth);
    attachFS(port, fs);
    stopAndReplay(fs);
    return fs;
}
