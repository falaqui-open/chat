import type { FileSystem } from '../filesystem.js';
import '../polyfills.js';
import type { Mixin } from './shared.js';
export declare class MutexLock {
    readonly path: string;
    protected readonly previous?: MutexLock | undefined;
    protected current: PromiseWithResolvers<void>;
    protected _isLocked: boolean;
    get isLocked(): boolean;
    constructor(path: string, previous?: MutexLock | undefined);
    done(): Promise<void>;
    unlock(): void;
    [Symbol.dispose](): void;
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
export declare function Mutexed<T extends new (...args: any[]) => FileSystem>(FS: T): Mixin<T, {
    lock(path: string, syscall: string): Promise<MutexLock>;
    lockSync(path: string): MutexLock;
    isLocked(path: string): boolean;
}>;
