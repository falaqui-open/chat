import { checkOptions, isBackend, isBackendConfig } from './backends/backend.js';
import { credentials } from './credentials.js';
import * as fs from './emulation/index.js';
import { Errno, ErrnoError } from './error.js';
import { FileSystem } from './filesystem.js';
function isMountConfig(arg) {
    return isBackendConfig(arg) || isBackend(arg) || arg instanceof FileSystem;
}
/**
 * Retrieve a file system with the given configuration.
 * @see MountConfiguration
 */
export async function resolveMountConfig(config, _depth = 0) {
    if (typeof config !== 'object' || config == null) {
        throw new ErrnoError(Errno.EINVAL, 'Invalid options on mount configuration');
    }
    if (!isMountConfig(config)) {
        throw new ErrnoError(Errno.EINVAL, 'Invalid mount configuration');
    }
    if (config instanceof FileSystem) {
        return config;
    }
    if (isBackend(config)) {
        config = { backend: config };
    }
    for (const [key, value] of Object.entries(config)) {
        if (key == 'backend') {
            continue;
        }
        if (!isMountConfig(value)) {
            continue;
        }
        if (_depth > 10) {
            throw new ErrnoError(Errno.EINVAL, 'Invalid configuration, too deep and possibly infinite');
        }
        config[key] = await resolveMountConfig(value, ++_depth);
    }
    const { backend } = config;
    if (!(await backend.isAvailable())) {
        throw new ErrnoError(Errno.EPERM, 'Backend not available: ' + backend.name);
    }
    await checkOptions(backend, config);
    const mount = (await backend.create(config));
    mount._disableSync = config.disableAsyncCache || false;
    await mount.ready();
    return mount;
}
/**
 * Configures ZenFS with single mount point /
 */
export async function configureSingle(config) {
    if (!isBackendConfig(config)) {
        throw new TypeError('Invalid single mount point configuration');
    }
    const resolved = await resolveMountConfig(config);
    fs.umount('/');
    fs.mount('/', resolved);
}
/**
 * Configures ZenFS with the given configuration
 * @see Configuration
 */
export async function configure(config) {
    const uid = 'uid' in config ? config.uid || 0 : 0;
    const gid = 'gid' in config ? config.gid || 0 : 0;
    Object.assign(credentials, { uid, gid, suid: uid, sgid: gid, euid: uid, egid: gid });
    if (!config.mounts) {
        return;
    }
    for (const [point, mountConfig] of Object.entries(config.mounts)) {
        if (!point.startsWith('/')) {
            throw new ErrnoError(Errno.EINVAL, 'Mount points must have absolute paths');
        }
        if (isBackendConfig(mountConfig)) {
            mountConfig.disableAsyncCache ?? (mountConfig.disableAsyncCache = config.disableAsyncCache || false);
        }
        config.mounts[point] = await resolveMountConfig(mountConfig);
    }
    fs.mountObject(config.mounts);
}
