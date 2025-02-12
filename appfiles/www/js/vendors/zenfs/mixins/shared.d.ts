import type { ExtractProperties } from 'utilium';
import type { FileSystem } from '../filesystem.js';
/**
 * `TBase` with `TMixin` mixed-in.
 * @internal @experimental
 */
export type Mixin<TBase extends typeof FileSystem, TMixin> = (abstract new (...args: any[]) => TMixin) & TBase;
/**
 * Asynchronous `FileSystem` methods. This is a convience type.
 * @internal
 */
export type _AsyncFSMethods = ExtractProperties<FileSystem, (...args: any[]) => Promise<unknown>>;
