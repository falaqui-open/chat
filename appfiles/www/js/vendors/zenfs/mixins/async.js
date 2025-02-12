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
import { join } from '../emulation/path.js';
import { Errno, ErrnoError } from '../error.js';
import { parseFlag, PreloadFile } from '../file.js';
/**
 * Async() implements synchronous methods on an asynchronous file system
 *
 * Implementing classes must define `_sync` for the synchronous file system used as a cache.
 *
 * Synchronous methods on an asynchronous FS are implemented by performing operations over the in-memory copy,
 * while asynchronously pipelining them to the backing store.
 * During loading, the contents of the async file system are preloaded into the synchronous store.
 *
 */
export function Async(FS) {
    class AsyncFS extends FS {
        constructor() {
            super(...arguments);
            /**
             * Queue of pending asynchronous operations.
             */
            this._queue = [];
            this._isInitialized = false;
        }
        get _queueRunning() {
            return !!this._queue.length;
        }
        queueDone() {
            return new Promise(resolve => {
                const check = () => (this._queueRunning ? setTimeout(check) : resolve());
                check();
            });
        }
        async ready() {
            await super.ready();
            if (this._isInitialized || this._disableSync) {
                return;
            }
            this.checkSync();
            await this._sync.ready();
            try {
                await this.crossCopy('/');
                this._isInitialized = true;
            }
            catch (e) {
                this._isInitialized = false;
                throw e;
            }
        }
        checkSync(path, syscall) {
            if (this._disableSync) {
                throw new ErrnoError(Errno.ENOTSUP, 'Sync caching has been disabled for this async file system', path, syscall);
            }
            if (!this._sync) {
                throw new ErrnoError(Errno.ENOTSUP, 'No sync cache is attached to this async file system', path, syscall);
            }
        }
        renameSync(oldPath, newPath) {
            this.checkSync(oldPath, 'rename');
            this._sync.renameSync(oldPath, newPath);
            this.queue('rename', oldPath, newPath);
        }
        statSync(path) {
            this.checkSync(path, 'stat');
            return this._sync.statSync(path);
        }
        createFileSync(path, flag, mode) {
            this.checkSync(path, 'createFile');
            this._sync.createFileSync(path, flag, mode);
            this.queue('createFile', path, flag, mode);
            return this.openFileSync(path, flag);
        }
        openFileSync(path, flag) {
            this.checkSync(path, 'openFile');
            const file = this._sync.openFileSync(path, flag);
            const stats = file.statSync();
            const buffer = new Uint8Array(stats.size);
            file.readSync(buffer);
            return new PreloadFile(this, path, flag, stats, buffer);
        }
        unlinkSync(path) {
            this.checkSync(path, 'unlinkSync');
            this._sync.unlinkSync(path);
            this.queue('unlink', path);
        }
        rmdirSync(path) {
            this.checkSync(path, 'rmdir');
            this._sync.rmdirSync(path);
            this.queue('rmdir', path);
        }
        mkdirSync(path, mode) {
            this.checkSync(path, 'mkdir');
            this._sync.mkdirSync(path, mode);
            this.queue('mkdir', path, mode);
        }
        readdirSync(path) {
            this.checkSync(path, 'readdir');
            return this._sync.readdirSync(path);
        }
        linkSync(srcpath, dstpath) {
            this.checkSync(srcpath, 'link');
            this._sync.linkSync(srcpath, dstpath);
            this.queue('link', srcpath, dstpath);
        }
        syncSync(path, data, stats) {
            this.checkSync(path, 'sync');
            this._sync.syncSync(path, data, stats);
            this.queue('sync', path, data, stats);
        }
        existsSync(path) {
            this.checkSync(path, 'exists');
            return this._sync.existsSync(path);
        }
        /**
         * @internal
         */
        async crossCopy(path) {
            this.checkSync(path, 'crossCopy');
            const stats = await this.stat(path);
            if (!stats.isDirectory()) {
                const env_1 = { stack: [], error: void 0, hasError: false };
                try {
                    const asyncFile = __addDisposableResource(env_1, await this.openFile(path, parseFlag('r')), true);
                    const syncFile = __addDisposableResource(env_1, this._sync.createFileSync(path, parseFlag('w'), stats.mode), false);
                    const buffer = new Uint8Array(stats.size);
                    await asyncFile.read(buffer);
                    syncFile.writeSync(buffer, 0, stats.size);
                    return;
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
            if (path !== '/') {
                const stats = await this.stat(path);
                this._sync.mkdirSync(path, stats.mode);
            }
            const files = await this.readdir(path);
            for (const file of files) {
                await this.crossCopy(join(path, file));
            }
        }
        /**
         * @internal
         */
        async _next() {
            if (!this._queueRunning) {
                return;
            }
            const [method, ...args] = this._queue.shift();
            // @ts-expect-error 2556 (since ...args is not correctly picked up as being a tuple)
            await this[method](...args);
            await this._next();
        }
        /**
         * @internal
         */
        queue(...op) {
            this._queue.push(op);
            void this._next();
        }
    }
    return AsyncFS;
}
