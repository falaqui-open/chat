import { Errno, ErrnoError } from '../error.js';
import { IndexFS } from './file_index.js';
async function fetchFile(path, type) {
    const response = await fetch(path).catch((e) => {
        throw new ErrnoError(Errno.EIO, e.message);
    });
    if (!response.ok) {
        throw new ErrnoError(Errno.EIO, 'fetch failed: response returned code ' + response.status);
    }
    switch (type) {
        case 'buffer': {
            const arrayBuffer = await response.arrayBuffer().catch((e) => {
                throw new ErrnoError(Errno.EIO, e.message);
            });
            return new Uint8Array(arrayBuffer);
        }
        case 'json':
            return response.json().catch((e) => {
                throw new ErrnoError(Errno.EIO, e.message);
            });
        default:
            throw new ErrnoError(Errno.EINVAL, 'Invalid download type: ' + type);
    }
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
export class FetchFS extends IndexFS {
    async ready() {
        if (this._isInitialized) {
            return;
        }
        await super.ready();
        if (this._disableSync) {
            return;
        }
        /**
         * Iterate over all of the files and cache their contents
         */
        for (const [path, stats] of this.index.files()) {
            await this.getData(path, stats);
        }
    }
    constructor({ index = 'index.json', baseUrl = '' }) {
        super(typeof index != 'string' ? index : fetchFile(index, 'json'));
        // prefix url must end in a directory separator.
        if (baseUrl.at(-1) != '/') {
            baseUrl += '/';
        }
        this.baseUrl = baseUrl;
    }
    metadata() {
        return {
            ...super.metadata(),
            name: FetchFS.name,
            readonly: true,
        };
    }
    /**
     * Preload the given file into the index.
     * @param path
     * @param buffer
     */
    preload(path, buffer) {
        const stats = this.index.get(path);
        if (!stats) {
            throw ErrnoError.With('ENOENT', path, 'preload');
        }
        if (!stats.isFile()) {
            throw ErrnoError.With('EISDIR', path, 'preload');
        }
        stats.size = buffer.length;
        stats.fileData = buffer;
    }
    /**
     * @todo Be lazier about actually requesting the data?
     */
    async getData(path, stats) {
        if (stats.fileData) {
            return stats.fileData;
        }
        const data = await fetchFile(this.baseUrl + (path.startsWith('/') ? path.slice(1) : path), 'buffer');
        stats.fileData = data;
        return data;
    }
    getDataSync(path, stats) {
        if (stats.fileData) {
            return stats.fileData;
        }
        throw new ErrnoError(Errno.ENODATA, '', path, 'getData');
    }
}
const _Fetch = {
    name: 'Fetch',
    options: {
        index: {
            type: ['string', 'object'],
            required: false,
            description: 'URL to a file index as a JSON file or the file index object itself, generated with the make-index script. Defaults to `index.json`.',
        },
        baseUrl: {
            type: 'string',
            required: false,
            description: 'Used as the URL prefix for fetched files. Default: Fetch files relative to the index.',
        },
    },
    isAvailable() {
        return typeof globalThis.fetch == 'function';
    },
    create(options) {
        return new FetchFS(options);
    },
};
export const Fetch = _Fetch;
