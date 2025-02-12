import type { FileSystemMetadata } from '../filesystem.js';
import type { Stats } from '../stats.js';
import { IndexFS } from './file_index.js';
import type { IndexData } from './file_index.js';
/**
 * Configuration options for FetchFS.
 */
export interface FetchOptions {
    /**
     * URL to a file index as a JSON file or the file index object itself.
     * Defaults to `index.json`.
     */
    index?: string | IndexData;
    /** Used as the URL prefix for fetched files.
     * Default: Fetch files relative to the index.
     */
    baseUrl?: string;
}
/**
 * A simple filesystem backed by HTTP using the `fetch` API.
 *
 *
 * Index objects look like the following:
 *
 * ```json
 * {
 * 	"version": 1,
 * 	"entries": {
 * 		"/home": { ... },
 * 		"/home/jvilk": { ... },
 * 		"/home/james": { ... }
 * 	}
 * }
 * ```
 *
 * Each entry contains the stats associated with the file.
 */
export declare class FetchFS extends IndexFS {
    readonly baseUrl: string;
    ready(): Promise<void>;
    constructor({ index, baseUrl }: FetchOptions);
    metadata(): FileSystemMetadata;
    /**
     * Preload the given file into the index.
     * @param path
     * @param buffer
     */
    preload(path: string, buffer: Uint8Array): void;
    /**
     * @todo Be lazier about actually requesting the data?
     */
    protected getData(path: string, stats: Stats): Promise<Uint8Array>;
    protected getDataSync(path: string, stats: Stats): Uint8Array;
}
declare const _Fetch: {
    readonly name: "Fetch";
    readonly options: {
        readonly index: {
            readonly type: readonly ["string", "object"];
            readonly required: false;
            readonly description: "URL to a file index as a JSON file or the file index object itself, generated with the make-index script. Defaults to `index.json`.";
        };
        readonly baseUrl: {
            readonly type: "string";
            readonly required: false;
            readonly description: "Used as the URL prefix for fetched files. Default: Fetch files relative to the index.";
        };
    };
    readonly isAvailable: () => boolean;
    readonly create: (options: FetchOptions) => FetchFS;
};
type _fetch = typeof _Fetch;
interface Fetch extends _fetch {
}
export declare const Fetch: Fetch;
export {};
