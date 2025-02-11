import { EventEmitter } from 'eventemitter3';
import { ErrnoError } from '../error.js';
import { isStatsEqual } from '../stats.js';
import { normalizePath } from '../utils.js';
import { dirname, basename } from './path.js';
import { statSync } from './sync.js';
/**
 * Base class for file system watchers.
 * Provides event handling capabilities for watching file system changes.
 *
 * @template TEvents The type of events emitted by the watcher.
 */
class Watcher extends EventEmitter {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    off(event, fn, context, once) {
        return super.off(event, fn, context, once);
    }
    removeListener(event, fn, context, once) {
        return super.removeListener(event, fn, context, once);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    constructor(path) {
        super();
        this.path = path;
    }
    setMaxListeners() {
        throw ErrnoError.With('ENOSYS', this.path, 'Watcher.setMaxListeners');
    }
    getMaxListeners() {
        throw ErrnoError.With('ENOSYS', this.path, 'Watcher.getMaxListeners');
    }
    prependListener() {
        throw ErrnoError.With('ENOSYS', this.path, 'Watcher.prependListener');
    }
    prependOnceListener() {
        throw ErrnoError.With('ENOSYS', this.path, 'Watcher.prependOnceListener');
    }
    rawListeners() {
        throw ErrnoError.With('ENOSYS', this.path, 'Watcher.rawListeners');
    }
    ref() {
        return this;
    }
    unref() {
        return this;
    }
}
/**
 * Watches for changes on the file system.
 *
 * @template T The type of the filename, either `string` or `Buffer`.
 */
export class FSWatcher extends Watcher {
    constructor(path, options) {
        super(path);
        this.options = options;
        addWatcher(path.toString(), this);
    }
    close() {
        super.emit('close');
        removeWatcher(this.path.toString(), this);
    }
    [Symbol.dispose]() {
        this.close();
    }
}
/**
 * Watches for changes to a file's stats.
 *
 * Instances of `StatWatcher` are used by `fs.watchFile()` to monitor changes to a file's statistics.
 */
export class StatWatcher extends Watcher {
    constructor(path, options) {
        super(path);
        this.options = options;
        this.start();
    }
    onInterval() {
        try {
            const current = statSync(this.path);
            if (!isStatsEqual(this.previous, current)) {
                this.emit('change', current, this.previous);
                this.previous = current;
            }
        }
        catch (e) {
            this.emit('error', e);
        }
    }
    start() {
        const interval = this.options.interval || 5000;
        try {
            this.previous = statSync(this.path);
        }
        catch (e) {
            this.emit('error', e);
            return;
        }
        this.intervalId = setInterval(this.onInterval.bind(this), interval);
        if (!this.options.persistent && typeof this.intervalId == 'object') {
            this.intervalId.unref();
        }
    }
    /**
     * @internal
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.removeAllListeners();
    }
}
const watchers = new Map();
export function addWatcher(path, watcher) {
    const normalizedPath = normalizePath(path);
    if (!watchers.has(normalizedPath)) {
        watchers.set(normalizedPath, new Set());
    }
    watchers.get(normalizedPath).add(watcher);
}
export function removeWatcher(path, watcher) {
    const normalizedPath = normalizePath(path);
    if (watchers.has(normalizedPath)) {
        watchers.get(normalizedPath).delete(watcher);
        if (watchers.get(normalizedPath).size === 0) {
            watchers.delete(normalizedPath);
        }
    }
}
export function emitChange(eventType, filename) {
    let normalizedFilename = normalizePath(filename);
    // Notify watchers on the specific file
    if (watchers.has(normalizedFilename)) {
        for (const watcher of watchers.get(normalizedFilename)) {
            watcher.emit('change', eventType, basename(filename));
        }
    }
    // Notify watchers on parent directories if they are watching recursively
    let parent = dirname(normalizedFilename);
    while (parent !== normalizedFilename && parent !== '/') {
        if (watchers.has(parent)) {
            for (const watcher of watchers.get(parent)) {
                watcher.emit('change', eventType, basename(filename));
            }
        }
        normalizedFilename = parent;
        parent = dirname(parent);
    }
}
