/// <reference types="node" resolution-mode="require"/>
import type { BigIntStatsFs, StatsFs } from 'node:fs';
import type { File } from '../file.js';
import type { FileSystem } from '../filesystem.js';
import { type AbsolutePath } from './path.js';
export declare const fdMap: Map<number, File>;
export declare function file2fd(file: File): number;
export declare function fd2file(fd: number): File;
export type MountObject = Record<AbsolutePath, FileSystem>;
/**
 * The map of mount points
 * @internal
 */
export declare const mounts: Map<string, FileSystem>;
/**
 * Mounts the file system at the given mount point.
 */
export declare function mount(mountPoint: string, fs: FileSystem): void;
/**
 * Unmounts the file system at the given mount point.
 */
export declare function umount(mountPoint: string): void;
/**
 * Gets the internal FileSystem for the path, then returns it along with the path relative to the FS' root
 */
export declare function resolveMount(path: string): {
    fs: FileSystem;
    path: string;
    mountPoint: string;
};
/**
 * Reverse maps the paths in text from the mounted FileSystem to the global path
 */
export declare function fixPaths(text: string, paths: Record<string, string>): string;
export declare function fixError<E extends Error>(e: E, paths: Record<string, string>): E;
export declare function mountObject(mounts: MountObject): void;
/**
 * @hidden
 */
export declare function _statfs<const T extends boolean>(fs: FileSystem, bigint?: T): T extends true ? BigIntStatsFs : StatsFs;
