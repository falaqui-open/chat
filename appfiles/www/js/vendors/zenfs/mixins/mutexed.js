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
import { ErrnoError } from '../error.js';
import '../polyfills.js';
export class MutexLock {
    get isLocked() {
        return this._isLocked;
    }
    constructor(path, previous) {
        this.path = path;
        this.previous = previous;
        this.current = Promise.withResolvers();
        this._isLocked = true;
    }
    async done() {
        await this.previous?.done();
        await this.current.promise;
    }
    unlock() {
        this.current.resolve();
        this._isLocked = false;
    }
    [Symbol.dispose]() {
        this.unlock();
    }
}
/**
 * This serializes access to an underlying async filesystem.
 * For example, on an OverlayFS instance with an async lower
 * directory operations like rename and rmdir may involve multiple
 * requests involving both the upper and lower filesystems -- they
 * are not executed in a single atomic step. OverlayFS uses this
 * to avoid having to reason about the correctness of
 * multiple requests interleaving.
 *
 * Note: `@ts-expect-error 2513` is needed because `FS` is not properly detected as being concrete
 *
 * @todo Change `using _` to `using void` pending https://github.com/tc39/proposal-discard-binding
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Mutexed(FS) {
    class MutexedFS extends FS {
        constructor() {
            super(...arguments);
            /**
             * The current locks
             */
            this.locks = new Map();
            /* eslint-enable @typescript-eslint/no-unused-vars */
        }
        /**
         * Adds a lock for a path
         */
        addLock(path) {
            const previous = this.locks.get(path);
            const lock = new MutexLock(path, previous?.isLocked ? previous : undefined);
            this.locks.set(path, lock);
            return lock;
        }
        /**
         * Locks `path` asynchronously.
         * If the path is currently locked, waits for it to be unlocked.
         * @internal
         */
        async lock(path, syscall) {
            const previous = this.locks.get(path);
            const lock = this.addLock(path);
            const stack = new Error().stack;
            setTimeout(() => {
                if (lock.isLocked) {
                    const error = ErrnoError.With('EDEADLK', path, syscall);
                    error.stack += stack?.slice('Error'.length);
                    throw error;
                }
            }, 5000);
            await previous?.done();
            return lock;
        }
        /**
         * Locks `path` asynchronously.
         * If the path is currently locked, an error will be thrown
         * @internal
         */
        lockSync(path) {
            if (this.locks.has(path)) {
                // Non-null assertion: we already checked locks has path
                throw ErrnoError.With('EBUSY', path, 'lock');
            }
            return this.addLock(path);
        }
        /**
         * Whether `path` is locked
         * @internal
         */
        isLocked(path) {
            return !!this.locks.get(path)?.isLocked;
        }
        /* eslint-disable @typescript-eslint/no-unused-vars */
        async rename(oldPath, newPath) {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_1, await this.lock(oldPath, 'rename'), false);
                // @ts-expect-error 2513
                await super.rename(oldPath, newPath);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        }
        renameSync(oldPath, newPath) {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_2, this.lockSync(oldPath), false);
                // @ts-expect-error 2513
                return super.renameSync(oldPath, newPath);
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        }
        async stat(path) {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_3, await this.lock(path, 'stat'), false);
                // @ts-expect-error 2513
                return await super.stat(path);
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        }
        statSync(path) {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_4, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.statSync(path);
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        }
        async openFile(path, flag) {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_5, await this.lock(path, 'openFile'), false);
                // @ts-expect-error 2513
                return await super.openFile(path, flag);
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        }
        openFileSync(path, flag) {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_6, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.openFileSync(path, flag);
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        }
        async createFile(path, flag, mode) {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_7, await this.lock(path, 'createFile'), false);
                // @ts-expect-error 2513
                return await super.createFile(path, flag, mode);
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        }
        createFileSync(path, flag, mode) {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_8, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.createFileSync(path, flag, mode);
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        }
        async unlink(path) {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_9, await this.lock(path, 'unlink'), false);
                // @ts-expect-error 2513
                await super.unlink(path);
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        }
        unlinkSync(path) {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_10, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.unlinkSync(path);
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        }
        async rmdir(path) {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_11, await this.lock(path, 'rmdir'), false);
                // @ts-expect-error 2513
                await super.rmdir(path);
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        }
        rmdirSync(path) {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_12, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.rmdirSync(path);
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        }
        async mkdir(path, mode) {
            const env_13 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_13, await this.lock(path, 'mkdir'), false);
                // @ts-expect-error 2513
                await super.mkdir(path, mode);
            }
            catch (e_13) {
                env_13.error = e_13;
                env_13.hasError = true;
            }
            finally {
                __disposeResources(env_13);
            }
        }
        mkdirSync(path, mode) {
            const env_14 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_14, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.mkdirSync(path, mode);
            }
            catch (e_14) {
                env_14.error = e_14;
                env_14.hasError = true;
            }
            finally {
                __disposeResources(env_14);
            }
        }
        async readdir(path) {
            const env_15 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_15, await this.lock(path, 'readdir'), false);
                // @ts-expect-error 2513
                return await super.readdir(path);
            }
            catch (e_15) {
                env_15.error = e_15;
                env_15.hasError = true;
            }
            finally {
                __disposeResources(env_15);
            }
        }
        readdirSync(path) {
            const env_16 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_16, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.readdirSync(path);
            }
            catch (e_16) {
                env_16.error = e_16;
                env_16.hasError = true;
            }
            finally {
                __disposeResources(env_16);
            }
        }
        async exists(path) {
            const env_17 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_17, await this.lock(path, 'exists'), false);
                return await super.exists(path);
            }
            catch (e_17) {
                env_17.error = e_17;
                env_17.hasError = true;
            }
            finally {
                __disposeResources(env_17);
            }
        }
        existsSync(path) {
            const env_18 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_18, this.lockSync(path), false);
                return super.existsSync(path);
            }
            catch (e_18) {
                env_18.error = e_18;
                env_18.hasError = true;
            }
            finally {
                __disposeResources(env_18);
            }
        }
        async link(srcpath, dstpath) {
            const env_19 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_19, await this.lock(srcpath, 'link'), false);
                // @ts-expect-error 2513
                await super.link(srcpath, dstpath);
            }
            catch (e_19) {
                env_19.error = e_19;
                env_19.hasError = true;
            }
            finally {
                __disposeResources(env_19);
            }
        }
        linkSync(srcpath, dstpath) {
            const env_20 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_20, this.lockSync(srcpath), false);
                // @ts-expect-error 2513
                return super.linkSync(srcpath, dstpath);
            }
            catch (e_20) {
                env_20.error = e_20;
                env_20.hasError = true;
            }
            finally {
                __disposeResources(env_20);
            }
        }
        async sync(path, data, stats) {
            const env_21 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_21, await this.lock(path, 'sync'), false);
                // @ts-expect-error 2513
                await super.sync(path, data, stats);
            }
            catch (e_21) {
                env_21.error = e_21;
                env_21.hasError = true;
            }
            finally {
                __disposeResources(env_21);
            }
        }
        syncSync(path, data, stats) {
            const env_22 = { stack: [], error: void 0, hasError: false };
            try {
                const _ = __addDisposableResource(env_22, this.lockSync(path), false);
                // @ts-expect-error 2513
                return super.syncSync(path, data, stats);
            }
            catch (e_22) {
                env_22.error = e_22;
                env_22.hasError = true;
            }
            finally {
                __disposeResources(env_22);
            }
        }
    }
    return MutexedFS;
}
