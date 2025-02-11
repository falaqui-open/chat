/**
 * Implements the asynchronous API in terms of the synchronous API.
 */
/* eslint-disable @typescript-eslint/require-await */
export function Sync(FS) {
    class SyncFS extends FS {
        async exists(path) {
            return this.existsSync(path);
        }
        async rename(oldPath, newPath) {
            return this.renameSync(oldPath, newPath);
        }
        async stat(path) {
            return this.statSync(path);
        }
        async createFile(path, flag, mode) {
            return this.createFileSync(path, flag, mode);
        }
        async openFile(path, flag) {
            return this.openFileSync(path, flag);
        }
        async unlink(path) {
            return this.unlinkSync(path);
        }
        async rmdir(path) {
            return this.rmdirSync(path);
        }
        async mkdir(path, mode) {
            return this.mkdirSync(path, mode);
        }
        async readdir(path) {
            return this.readdirSync(path);
        }
        async link(srcpath, dstpath) {
            return this.linkSync(srcpath, dstpath);
        }
        async sync(path, data, stats) {
            return this.syncSync(path, data, stats);
        }
    }
    return SyncFS;
}
/* eslint-enable @typescript-eslint/require-await */
