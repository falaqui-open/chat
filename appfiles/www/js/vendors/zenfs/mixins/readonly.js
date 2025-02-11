import { Errno, ErrnoError } from '../error.js';
/**
 * Implements the non-readonly methods to throw `EROFS`
 */
/* eslint-disable @typescript-eslint/require-await */
export function Readonly(FS) {
    class ReadonlyFS extends FS {
        metadata() {
            return { ...super.metadata(), readonly: true };
        }
        /* eslint-disable @typescript-eslint/no-unused-vars */
        async rename(oldPath, newPath) {
            throw new ErrnoError(Errno.EROFS);
        }
        renameSync(oldPath, newPath) {
            throw new ErrnoError(Errno.EROFS);
        }
        async createFile(path, flag, mode) {
            throw new ErrnoError(Errno.EROFS);
        }
        createFileSync(path, flag, mode) {
            throw new ErrnoError(Errno.EROFS);
        }
        async unlink(path) {
            throw new ErrnoError(Errno.EROFS);
        }
        unlinkSync(path) {
            throw new ErrnoError(Errno.EROFS);
        }
        async rmdir(path) {
            throw new ErrnoError(Errno.EROFS);
        }
        rmdirSync(path) {
            throw new ErrnoError(Errno.EROFS);
        }
        async mkdir(path, mode) {
            throw new ErrnoError(Errno.EROFS);
        }
        mkdirSync(path, mode) {
            throw new ErrnoError(Errno.EROFS);
        }
        async link(srcpath, dstpath) {
            throw new ErrnoError(Errno.EROFS);
        }
        linkSync(srcpath, dstpath) {
            throw new ErrnoError(Errno.EROFS);
        }
        async sync(path, data, stats) {
            throw new ErrnoError(Errno.EROFS);
        }
        syncSync(path, data, stats) {
            throw new ErrnoError(Errno.EROFS);
        }
    }
    return ReadonlyFS;
}
/* eslint-enable @typescript-eslint/require-await */
