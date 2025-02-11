// Utilities and shared data
import { InMemory } from '../backends/memory.js';
import { Errno, ErrnoError } from '../error.js';
import { size_max } from '../inode.js';
import { normalizePath } from '../utils.js';
import { resolve } from './path.js';
// descriptors
export const fdMap = new Map();
let nextFd = 100;
export function file2fd(file) {
    const fd = nextFd++;
    fdMap.set(fd, file);
    return fd;
}
export function fd2file(fd) {
    if (!fdMap.has(fd)) {
        throw new ErrnoError(Errno.EBADF);
    }
    return fdMap.get(fd);
}
/**
 * The map of mount points
 * @internal
 */
export const mounts = new Map();
/*
Set a default root.
*/
mount('/', InMemory.create({ name: 'root' }));
/**
 * Mounts the file system at the given mount point.
 */
export function mount(mountPoint, fs) {
    if (mountPoint[0] !== '/') {
        mountPoint = '/' + mountPoint;
    }
    mountPoint = resolve(mountPoint);
    if (mounts.has(mountPoint)) {
        throw new ErrnoError(Errno.EINVAL, 'Mount point ' + mountPoint + ' is already in use.');
    }
    mounts.set(mountPoint, fs);
}
/**
 * Unmounts the file system at the given mount point.
 */
export function umount(mountPoint) {
    if (mountPoint[0] !== '/') {
        mountPoint = `/${mountPoint}`;
    }
    mountPoint = resolve(mountPoint);
    if (!mounts.has(mountPoint)) {
        throw new ErrnoError(Errno.EINVAL, 'Mount point ' + mountPoint + ' is already unmounted.');
    }
    mounts.delete(mountPoint);
}
/**
 * Gets the internal FileSystem for the path, then returns it along with the path relative to the FS' root
 */
export function resolveMount(path) {
    path = normalizePath(path);
    const sortedMounts = [...mounts].sort((a, b) => (a[0].length > b[0].length ? -1 : 1)); // decending order of the string length
    for (const [mountPoint, fs] of sortedMounts) {
        // We know path is normalized, so it would be a substring of the mount point.
        if (mountPoint.length <= path.length && path.startsWith(mountPoint)) {
            path = path.slice(mountPoint.length > 1 ? mountPoint.length : 0); // Resolve the path relative to the mount point
            if (path === '') {
                path = '/';
            }
            return { fs, path, mountPoint };
        }
    }
    throw new ErrnoError(Errno.EIO, 'ZenFS not initialized with a file system');
}
/**
 * Reverse maps the paths in text from the mounted FileSystem to the global path
 */
export function fixPaths(text, paths) {
    for (const [from, to] of Object.entries(paths)) {
        text = text?.replaceAll(from, to);
    }
    return text;
}
export function fixError(e, paths) {
    if (typeof e.stack == 'string') {
        e.stack = fixPaths(e.stack, paths);
    }
    e.message = fixPaths(e.message, paths);
    return e;
}
export function mountObject(mounts) {
    if ('/' in mounts) {
        umount('/');
    }
    for (const [point, fs] of Object.entries(mounts)) {
        mount(point, fs);
    }
}
/**
 * @hidden
 */
export function _statfs(fs, bigint) {
    const md = fs.metadata();
    const bs = md.blockSize || 4096;
    return {
        type: (bigint ? BigInt : Number)(md.type),
        bsize: (bigint ? BigInt : Number)(bs),
        ffree: (bigint ? BigInt : Number)(md.freeNodes || size_max),
        files: (bigint ? BigInt : Number)(md.totalNodes || size_max),
        bavail: (bigint ? BigInt : Number)(md.freeSpace / bs),
        bfree: (bigint ? BigInt : Number)(md.freeSpace / bs),
        blocks: (bigint ? BigInt : Number)(md.totalSpace / bs),
    };
}
