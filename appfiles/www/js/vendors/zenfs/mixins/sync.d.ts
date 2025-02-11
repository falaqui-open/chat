import type { FileSystem } from '../filesystem.js';
import type { Mixin, _AsyncFSMethods } from './shared.js';
/**
 * Implements the asynchronous API in terms of the synchronous API.
 */
export declare function Sync<T extends typeof FileSystem>(FS: T): Mixin<T, _AsyncFSMethods>;
