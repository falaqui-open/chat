import { Readable, Writable } from 'readable-stream';
import { ErrnoError, Errno } from '../error.js';
export class ReadStream extends Readable {
    close(callback = () => null) {
        try {
            super.destroy();
            super.emit('close');
            callback();
        }
        catch (err) {
            callback(new ErrnoError(Errno.EIO, err.toString()));
        }
    }
}
export class WriteStream extends Writable {
    close(callback = () => null) {
        try {
            super.destroy();
            super.emit('close');
            callback();
        }
        catch (err) {
            callback(new ErrnoError(Errno.EIO, err.toString()));
        }
    }
}
