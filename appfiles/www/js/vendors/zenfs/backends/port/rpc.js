/* eslint-disable @typescript-eslint/no-explicit-any */
import { Errno, ErrnoError } from '../../error.js';
import { handleRequest, PortFile } from './fs.js';
function isFileData(value) {
    return typeof value == 'object' && value != null && 'fd' in value && 'path' in value && 'position' in value;
}
// general types
export function isMessage(arg) {
    return typeof arg == 'object' && arg != null && '_zenfs' in arg && !!arg._zenfs;
}
const executors = new Map();
export function request(request, { port, timeout = 1000, fs } = {}) {
    const stack = new Error().stack.slice('Error:'.length);
    if (!port) {
        throw ErrnoError.With('EINVAL');
    }
    return new Promise((resolve, reject) => {
        const id = Math.random().toString(16).slice(10);
        executors.set(id, { resolve, reject, fs });
        port.postMessage({ ...request, _zenfs: true, id, stack });
        const _ = setTimeout(() => {
            const error = new ErrnoError(Errno.EIO, 'RPC Failed');
            error.stack += stack;
            reject(error);
            if (typeof _ == 'object')
                _.unref();
        }, timeout);
    });
}
export function handleResponse(response) {
    if (!isMessage(response)) {
        return;
    }
    const { id, value, error, stack } = response;
    if (!executors.has(id)) {
        const error = new ErrnoError(Errno.EIO, 'Invalid RPC id:' + id);
        error.stack += stack;
        throw error;
    }
    const { resolve, reject, fs } = executors.get(id);
    if (error) {
        const e = typeof value == 'string' ? new Error(value) : ErrnoError.fromJSON(value);
        e.stack += stack;
        reject(e);
        executors.delete(id);
        return;
    }
    if (isFileData(value)) {
        const { fd, path, position } = value;
        const file = new PortFile(fs, fd, path, position);
        resolve(file);
        executors.delete(id);
        return;
    }
    resolve(value);
    executors.delete(id);
    return;
}
export function attach(port, handler) {
    if (!port) {
        throw ErrnoError.With('EINVAL');
    }
    port['on' in port ? 'on' : 'addEventListener']('message', (message) => {
        handler('data' in message ? message.data : message);
    });
}
export function detach(port, handler) {
    if (!port) {
        throw ErrnoError.With('EINVAL');
    }
    port['off' in port ? 'off' : 'removeEventListener']('message', (message) => {
        handler('data' in message ? message.data : message);
    });
}
export function catchMessages(port) {
    const events = [];
    const handler = events.push.bind(events);
    attach(port, handler);
    return function (fs) {
        detach(port, handler);
        for (const event of events) {
            const request = 'data' in event ? event.data : event;
            void handleRequest(port, fs, request);
        }
    };
}
