/**
 * Credentials used for various operations.
 * Similar to Linux's cred struct.
 * @see https://github.com/torvalds/linux/blob/master/include/linux/cred.h
 */
export interface Credentials {
    uid: number;
    gid: number;
    suid: number;
    sgid: number;
    euid: number;
    egid: number;
}
export declare const credentials: Credentials;
export declare const rootCredentials: Credentials;
