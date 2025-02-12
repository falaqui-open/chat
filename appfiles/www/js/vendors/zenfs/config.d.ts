import type { Backend, BackendConfiguration, FilesystemOf, SharedConfig } from './backends/backend.js';
import type { AbsolutePath } from './emulation/path.js';
/**
 * Configuration for a specific mount point
 */
export type MountConfiguration<T extends Backend> = FilesystemOf<T> | BackendConfiguration<T> | T;
/**
 * Retrieve a file system with the given configuration.
 * @see MountConfiguration
 */
export declare function resolveMountConfig<T extends Backend>(config: MountConfiguration<T>, _depth?: number): Promise<FilesystemOf<T>>;
export interface ConfigMounts {
    [K: AbsolutePath]: Backend;
}
/**
 * Configuration
 */
export interface Configuration<T extends ConfigMounts> extends SharedConfig {
    /**
     * An object mapping mount points to mount configuration
     */
    mounts: {
        [K in keyof T & AbsolutePath]: MountConfiguration<T[K]>;
    };
    /**
     * The uid to use
     */
    uid: number;
    /**
     * The gid to use
     */
    gid: number;
}
/**
 * Configures ZenFS with single mount point /
 */
export declare function configureSingle<T extends Backend>(config: MountConfiguration<T>): Promise<void>;
/**
 * Configures ZenFS with the given configuration
 * @see Configuration
 */
export declare function configure<T extends ConfigMounts>(config: Partial<Configuration<T>>): Promise<void>;
