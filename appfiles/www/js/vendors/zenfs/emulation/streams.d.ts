/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import type * as Node from 'fs';
import { Readable, Writable } from 'readable-stream';
import type { Callback } from '../utils.js';
export declare class ReadStream extends Readable implements Node.ReadStream {
    close(callback?: Callback): void;
    bytesRead: number;
    path: string | Buffer;
    pending: boolean;
}
export declare class WriteStream extends Writable implements Node.WriteStream {
    close(callback?: Callback): void;
    bytesWritten: number;
    path: string | Buffer;
    pending: boolean;
}
