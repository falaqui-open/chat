var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { credentials } from '../../credentials.js';
import { S_IFDIR, S_IFREG } from '../../emulation/constants.js';
import { basename, dirname, join, resolve } from '../../emulation/path.js';
import { Errno, ErrnoError } from '../../error.js';
import { PreloadFile } from '../../file.js';
import { FileSystem } from '../../filesystem.js';
import { Inode, randomIno, rootIno } from '../../inode.js';
import { decodeDirListing, encode, encodeDirListing } from '../../utils.js';
const maxInodeAllocTries = 5;
/**
 * A file system which uses a key-value store.
 *
 * We use a unique ID for each node in the file system. The root node has a fixed ID.
 * @todo Introduce Node ID caching.
 * @todo Check modes.
 * @internal
 */
export class StoreFS extends FileSystem {
    async ready() {
        if (this._initialized) {
            return;
        }
        await this.checkRoot();
        this._initialized = true;
    }
    constructor(store) {
        super();
        this.store = store;
        this._initialized = false;
    }
    metadata() {
        return {
            ...super.metadata(),
            name: this.store.name,
        };
    }
    /**
     * Delete all contents stored in the file system.
     * @deprecated
     */
    async empty() {
        await this.store.clear();
        // Root always exists.
        await this.checkRoot();
    }
    /**
     * Delete all contents stored in the file system.
     * @deprecated
     */
    emptySync() {
        this.store.clearSync();
        // Root always exists.
        this.checkRootSync();
    }
    /**
     * @todo Make rename compatible with the cache.
     */
    async rename(oldPath, newPath) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_1, this.store.transaction(), true);
            const oldParent = dirname(oldPath), oldName = basename(oldPath), newParent = dirname(newPath), newName = basename(newPath), 
            // Remove oldPath from parent's directory listing.
            oldDirNode = await this.findINode(tx, oldParent), oldDirList = await this.getDirListing(tx, oldDirNode, oldParent);
            if (!oldDirList[oldName]) {
                throw ErrnoError.With('ENOENT', oldPath, 'rename');
            }
            const nodeId = oldDirList[oldName];
            delete oldDirList[oldName];
            // Invariant: Can't move a folder inside itself.
            // This funny little hack ensures that the check passes only if oldPath
            // is a subpath of newParent. We append '/' to avoid matching folders that
            // are a substring of the bottom-most folder in the path.
            if ((newParent + '/').indexOf(oldPath + '/') === 0) {
                throw new ErrnoError(Errno.EBUSY, oldParent);
            }
            // Add newPath to parent's directory listing.
            let newDirNode, newDirList;
            if (newParent === oldParent) {
                // Prevent us from re-grabbing the same directory listing, which still
                // contains oldName.
                newDirNode = oldDirNode;
                newDirList = oldDirList;
            }
            else {
                newDirNode = await this.findINode(tx, newParent);
                newDirList = await this.getDirListing(tx, newDirNode, newParent);
            }
            if (newDirList[newName]) {
                // If it's a file, delete it, if it's a directory, throw a permissions error.
                const newNameNode = await this.getINode(tx, newDirList[newName], newPath);
                if (!newNameNode.toStats().isFile()) {
                    throw ErrnoError.With('EPERM', newPath, 'rename');
                }
                await tx.remove(newNameNode.ino);
                await tx.remove(newDirList[newName]);
            }
            newDirList[newName] = nodeId;
            // Commit the two changed directory listings.
            await tx.set(oldDirNode.ino, encodeDirListing(oldDirList));
            await tx.set(newDirNode.ino, encodeDirListing(newDirList));
            await tx.commit();
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            const result_1 = __disposeResources(env_1);
            if (result_1)
                await result_1;
        }
    }
    renameSync(oldPath, newPath) {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_2, this.store.transaction(), false);
            const oldParent = dirname(oldPath), oldName = basename(oldPath), newParent = dirname(newPath), newName = basename(newPath), 
            // Remove oldPath from parent's directory listing.
            oldDirNode = this.findINodeSync(tx, oldParent), oldDirList = this.getDirListingSync(tx, oldDirNode, oldParent);
            if (!oldDirList[oldName]) {
                throw ErrnoError.With('ENOENT', oldPath, 'rename');
            }
            const ino = oldDirList[oldName];
            delete oldDirList[oldName];
            // Invariant: Can't move a folder inside itself.
            // This funny little hack ensures that the check passes only if oldPath
            // is a subpath of newParent. We append '/' to avoid matching folders that
            // are a substring of the bottom-most folder in the path.
            if ((newParent + '/').indexOf(oldPath + '/') == 0) {
                throw new ErrnoError(Errno.EBUSY, oldParent);
            }
            // Add newPath to parent's directory listing.
            let newDirNode, newDirList;
            if (newParent === oldParent) {
                // Prevent us from re-grabbing the same directory listing, which still
                // contains oldName.
                newDirNode = oldDirNode;
                newDirList = oldDirList;
            }
            else {
                newDirNode = this.findINodeSync(tx, newParent);
                newDirList = this.getDirListingSync(tx, newDirNode, newParent);
            }
            if (newDirList[newName]) {
                // If it's a file, delete it, if it's a directory, throw a permissions error.
                const newNameNode = this.getINodeSync(tx, newDirList[newName], newPath);
                if (!newNameNode.toStats().isFile()) {
                    throw ErrnoError.With('EPERM', newPath, 'rename');
                }
                tx.removeSync(newNameNode.ino);
                tx.removeSync(newDirList[newName]);
            }
            newDirList[newName] = ino;
            // Commit the two changed directory listings.
            tx.setSync(oldDirNode.ino, encodeDirListing(oldDirList));
            tx.setSync(newDirNode.ino, encodeDirListing(newDirList));
            tx.commitSync();
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    }
    async stat(path) {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_3, this.store.transaction(), true);
            const inode = await this.findINode(tx, path);
            if (!inode) {
                throw ErrnoError.With('ENOENT', path, 'stat');
            }
            return inode.toStats();
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            const result_2 = __disposeResources(env_3);
            if (result_2)
                await result_2;
        }
    }
    statSync(path) {
        const env_4 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_4, this.store.transaction(), false);
            // Get the inode to the item, convert it into a Stats object.
            return this.findINodeSync(tx, path).toStats();
        }
        catch (e_4) {
            env_4.error = e_4;
            env_4.hasError = true;
        }
        finally {
            __disposeResources(env_4);
        }
    }
    async createFile(path, flag, mode) {
        const node = await this.commitNew(path, S_IFREG, mode, new Uint8Array(0));
        return new PreloadFile(this, path, flag, node.toStats(), new Uint8Array(0));
    }
    createFileSync(path, flag, mode) {
        this.commitNewSync(path, S_IFREG, mode);
        return this.openFileSync(path, flag);
    }
    async openFile(path, flag) {
        const env_5 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_5, this.store.transaction(), true);
            const node = await this.findINode(tx, path), data = await tx.get(node.ino);
            if (!data) {
                throw ErrnoError.With('ENOENT', path, 'openFile');
            }
            return new PreloadFile(this, path, flag, node.toStats(), data);
        }
        catch (e_5) {
            env_5.error = e_5;
            env_5.hasError = true;
        }
        finally {
            const result_3 = __disposeResources(env_5);
            if (result_3)
                await result_3;
        }
    }
    openFileSync(path, flag) {
        const env_6 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_6, this.store.transaction(), false);
            const node = this.findINodeSync(tx, path), data = tx.getSync(node.ino);
            if (!data) {
                throw ErrnoError.With('ENOENT', path, 'openFile');
            }
            return new PreloadFile(this, path, flag, node.toStats(), data);
        }
        catch (e_6) {
            env_6.error = e_6;
            env_6.hasError = true;
        }
        finally {
            __disposeResources(env_6);
        }
    }
    async unlink(path) {
        return this.remove(path, false);
    }
    unlinkSync(path) {
        this.removeSync(path, false);
    }
    async rmdir(path) {
        // Check first if directory is empty.
        if ((await this.readdir(path)).length) {
            throw ErrnoError.With('ENOTEMPTY', path, 'rmdir');
        }
        await this.remove(path, true);
    }
    rmdirSync(path) {
        // Check first if directory is empty.
        if (this.readdirSync(path).length) {
            throw ErrnoError.With('ENOTEMPTY', path, 'rmdir');
        }
        this.removeSync(path, true);
    }
    async mkdir(path, mode) {
        await this.commitNew(path, S_IFDIR, mode, encode('{}'));
    }
    mkdirSync(path, mode) {
        this.commitNewSync(path, S_IFDIR, mode, encode('{}'));
    }
    async readdir(path) {
        const env_7 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_7, this.store.transaction(), true);
            const node = await this.findINode(tx, path);
            return Object.keys(await this.getDirListing(tx, node, path));
        }
        catch (e_7) {
            env_7.error = e_7;
            env_7.hasError = true;
        }
        finally {
            const result_4 = __disposeResources(env_7);
            if (result_4)
                await result_4;
        }
    }
    readdirSync(path) {
        const env_8 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_8, this.store.transaction(), false);
            const node = this.findINodeSync(tx, path);
            return Object.keys(this.getDirListingSync(tx, node, path));
        }
        catch (e_8) {
            env_8.error = e_8;
            env_8.hasError = true;
        }
        finally {
            __disposeResources(env_8);
        }
    }
    /**
     * Updated the inode and data node at the given path
     * @todo Ensure mtime updates properly, and use that to determine if a data update is required.
     */
    async sync(path, data, stats) {
        const env_9 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_9, this.store.transaction(), true);
            // We use _findInode because we actually need the INode id.
            const fileInodeId = await this._findINode(tx, dirname(path), basename(path)), fileInode = await this.getINode(tx, fileInodeId, path), inodeChanged = fileInode.update(stats);
            // Sync data.
            await tx.set(fileInode.ino, data);
            // Sync metadata.
            if (inodeChanged) {
                await tx.set(fileInodeId, fileInode.data);
            }
            await tx.commit();
        }
        catch (e_9) {
            env_9.error = e_9;
            env_9.hasError = true;
        }
        finally {
            const result_5 = __disposeResources(env_9);
            if (result_5)
                await result_5;
        }
    }
    /**
     * Updated the inode and data node at the given path
     * @todo Ensure mtime updates properly, and use that to determine if a data update is required.
     */
    syncSync(path, data, stats) {
        const env_10 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_10, this.store.transaction(), false);
            // We use _findInode because we actually need the INode id.
            const fileInodeId = this._findINodeSync(tx, dirname(path), basename(path)), fileInode = this.getINodeSync(tx, fileInodeId, path), inodeChanged = fileInode.update(stats);
            // Sync data.
            tx.setSync(fileInode.ino, data);
            // Sync metadata.
            if (inodeChanged) {
                tx.setSync(fileInodeId, fileInode.data);
            }
            tx.commitSync();
        }
        catch (e_10) {
            env_10.error = e_10;
            env_10.hasError = true;
        }
        finally {
            __disposeResources(env_10);
        }
    }
    async link(target, link) {
        const env_11 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_11, this.store.transaction(), true);
            const newDir = dirname(link), newDirNode = await this.findINode(tx, newDir), listing = await this.getDirListing(tx, newDirNode, newDir);
            const ino = await this._findINode(tx, dirname(target), basename(target));
            const node = await this.getINode(tx, ino, target);
            node.nlink++;
            listing[basename(link)] = ino;
            tx.setSync(ino, node.data);
            tx.setSync(newDirNode.ino, encodeDirListing(listing));
            tx.commitSync();
        }
        catch (e_11) {
            env_11.error = e_11;
            env_11.hasError = true;
        }
        finally {
            const result_6 = __disposeResources(env_11);
            if (result_6)
                await result_6;
        }
    }
    linkSync(target, link) {
        const env_12 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_12, this.store.transaction(), false);
            const newDir = dirname(link), newDirNode = this.findINodeSync(tx, newDir), listing = this.getDirListingSync(tx, newDirNode, newDir);
            const ino = this._findINodeSync(tx, dirname(target), basename(target));
            const node = this.getINodeSync(tx, ino, target);
            node.nlink++;
            listing[basename(link)] = ino;
            tx.setSync(ino, node.data);
            tx.setSync(newDirNode.ino, encodeDirListing(listing));
            tx.commitSync();
        }
        catch (e_12) {
            env_12.error = e_12;
            env_12.hasError = true;
        }
        finally {
            __disposeResources(env_12);
        }
    }
    /**
     * Checks if the root directory exists. Creates it if it doesn't.
     */
    async checkRoot() {
        const env_13 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_13, this.store.transaction(), true);
            if (await tx.get(rootIno)) {
                return;
            }
            // Create new inode. o777, owned by root:root
            const inode = new Inode();
            inode.mode = 0o777 | S_IFDIR;
            // If the root doesn't exist, the first random ID shouldn't exist either.
            await tx.set(inode.ino, encode('{}'));
            await tx.set(rootIno, inode.data);
            await tx.commit();
        }
        catch (e_13) {
            env_13.error = e_13;
            env_13.hasError = true;
        }
        finally {
            const result_7 = __disposeResources(env_13);
            if (result_7)
                await result_7;
        }
    }
    /**
     * Checks if the root directory exists. Creates it if it doesn't.
     */
    checkRootSync() {
        const env_14 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_14, this.store.transaction(), false);
            if (tx.getSync(rootIno)) {
                return;
            }
            // Create new inode, mode o777, owned by root:root
            const inode = new Inode();
            inode.mode = 0o777 | S_IFDIR;
            // If the root doesn't exist, the first random ID shouldn't exist either.
            tx.setSync(inode.ino, encode('{}'));
            tx.setSync(rootIno, inode.data);
            tx.commitSync();
        }
        catch (e_14) {
            env_14.error = e_14;
            env_14.hasError = true;
        }
        finally {
            __disposeResources(env_14);
        }
    }
    /**
     * Helper function for findINode.
     * @param parent The parent directory of the file we are attempting to find.
     * @param filename The filename of the inode we are attempting to find, minus
     *   the parent.
     */
    async _findINode(tx, parent, filename, visited = new Set()) {
        const currentPath = join(parent, filename);
        if (visited.has(currentPath)) {
            throw new ErrnoError(Errno.EIO, 'Infinite loop detected while finding inode', currentPath);
        }
        visited.add(currentPath);
        if (parent == '/' && filename === '') {
            return rootIno;
        }
        const inode = parent == '/' ? await this.getINode(tx, rootIno, parent) : await this.findINode(tx, parent, visited);
        const dirList = await this.getDirListing(tx, inode, parent);
        if (!(filename in dirList)) {
            throw ErrnoError.With('ENOENT', resolve(parent, filename), '_findINode');
        }
        return dirList[filename];
    }
    /**
     * Helper function for findINode.
     * @param parent The parent directory of the file we are attempting to find.
     * @param filename The filename of the inode we are attempting to find, minus
     *   the parent.
     * @return string The ID of the file's inode in the file system.
     */
    _findINodeSync(tx, parent, filename, visited = new Set()) {
        const currentPath = join(parent, filename);
        if (visited.has(currentPath)) {
            throw new ErrnoError(Errno.EIO, 'Infinite loop detected while finding inode', currentPath);
        }
        visited.add(currentPath);
        if (parent == '/' && filename === '') {
            return rootIno;
        }
        const inode = parent == '/' ? this.getINodeSync(tx, rootIno, parent) : this.findINodeSync(tx, parent, visited);
        const dir = this.getDirListingSync(tx, inode, parent);
        if (!(filename in dir)) {
            throw ErrnoError.With('ENOENT', resolve(parent, filename), '_findINode');
        }
        return dir[filename];
    }
    /**
     * Finds the Inode of the given path.
     * @param path The path to look up.
     * @todo memoize/cache
     */
    async findINode(tx, path, visited = new Set()) {
        const id = await this._findINode(tx, dirname(path), basename(path), visited);
        return this.getINode(tx, id, path);
    }
    /**
     * Finds the Inode of the given path.
     * @param path The path to look up.
     * @return The Inode of the path p.
     * @todo memoize/cache
     */
    findINodeSync(tx, path, visited = new Set()) {
        const ino = this._findINodeSync(tx, dirname(path), basename(path), visited);
        return this.getINodeSync(tx, ino, path);
    }
    /**
     * Given the ID of a node, retrieves the corresponding Inode.
     * @param tx The transaction to use.
     * @param path The corresponding path to the file (used for error messages).
     * @param id The ID to look up.
     */
    async getINode(tx, id, path) {
        const data = await tx.get(id);
        if (!data) {
            throw ErrnoError.With('ENOENT', path, 'getINode');
        }
        return new Inode(data.buffer);
    }
    /**
     * Given the ID of a node, retrieves the corresponding Inode.
     * @param tx The transaction to use.
     * @param path The corresponding path to the file (used for error messages).
     * @param id The ID to look up.
     */
    getINodeSync(tx, id, path) {
        const data = tx.getSync(id);
        if (!data) {
            throw ErrnoError.With('ENOENT', path, 'getINode');
        }
        const inode = new Inode(data.buffer);
        return inode;
    }
    /**
     * Given the Inode of a directory, retrieves the corresponding directory
     * listing.
     */
    async getDirListing(tx, inode, path) {
        if (!inode.toStats().isDirectory()) {
            throw ErrnoError.With('ENOTDIR', path, 'getDirListing');
        }
        const data = await tx.get(inode.ino);
        if (!data) {
            /*
                Occurs when data is undefined, or corresponds to something other
                than a directory listing. The latter should never occur unless
                the file system is corrupted.
             */
            throw ErrnoError.With('ENOENT', path, 'getDirListing');
        }
        return decodeDirListing(data);
    }
    /**
     * Given the Inode of a directory, retrieves the corresponding directory listing.
     */
    getDirListingSync(tx, inode, p) {
        if (!inode.toStats().isDirectory()) {
            throw ErrnoError.With('ENOTDIR', p, 'getDirListing');
        }
        const data = tx.getSync(inode.ino);
        if (!data) {
            throw ErrnoError.With('ENOENT', p, 'getDirListing');
        }
        return decodeDirListing(data);
    }
    /**
     * Adds a new node under a random ID. Retries before giving up in
     * the exceedingly unlikely chance that we try to reuse a random ino.
     */
    async addNew(tx, data, path) {
        for (let i = 0; i < maxInodeAllocTries; i++) {
            const ino = randomIno();
            if (await tx.get(ino)) {
                continue;
            }
            await tx.set(ino, data);
            return ino;
        }
        throw new ErrnoError(Errno.ENOSPC, 'No inode IDs available', path, 'addNewNode');
    }
    /**
     * Creates a new node under a random ID. Retries before giving up in
     * the exceedingly unlikely chance that we try to reuse a random ino.
     * @return The ino that the data was stored under.
     */
    addNewSync(tx, data, path) {
        for (let i = 0; i < maxInodeAllocTries; i++) {
            const ino = randomIno();
            if (tx.getSync(ino)) {
                continue;
            }
            tx.setSync(ino, data);
            return ino;
        }
        throw new ErrnoError(Errno.ENOSPC, 'No inode IDs available', path, 'addNewNode');
    }
    /**
     * Commits a new file (well, a FILE or a DIRECTORY) to the file system with
     * the given mode.
     * Note: This will commit the transaction.
     * @param path The path to the new file.
     * @param type The type of the new file.
     * @param mode The mode to create the new file with.
     * @param cred The UID/GID to create the file with
     * @param data The data to store at the file's data node.
     */
    async commitNew(path, type, mode, data) {
        const env_15 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_15, this.store.transaction(), true);
            const parentPath = dirname(path), parent = await this.findINode(tx, parentPath);
            const fname = basename(path), listing = await this.getDirListing(tx, parent, parentPath);
            /*
                The root always exists.
                If we don't check this prior to taking steps below,
                we will create a file with name '' in root should path == '/'.
            */
            if (path === '/') {
                throw ErrnoError.With('EEXIST', path, 'commitNew');
            }
            // Check if file already exists.
            if (listing[fname]) {
                await tx.abort();
                throw ErrnoError.With('EEXIST', path, 'commitNew');
            }
            // Commit data.
            const inode = new Inode();
            inode.ino = await this.addNew(tx, data, path);
            inode.mode = mode | type;
            inode.uid = credentials.uid;
            inode.gid = credentials.gid;
            inode.size = data.length;
            // Update and commit parent directory listing.
            listing[fname] = await this.addNew(tx, inode.data, path);
            await tx.set(parent.ino, encodeDirListing(listing));
            await tx.commit();
            return inode;
        }
        catch (e_15) {
            env_15.error = e_15;
            env_15.hasError = true;
        }
        finally {
            const result_8 = __disposeResources(env_15);
            if (result_8)
                await result_8;
        }
    }
    /**
     * Commits a new file (well, a FILE or a DIRECTORY) to the file system with the given mode.
     * Note: This will commit the transaction.
     * @param path The path to the new file.
     * @param type The type of the new file.
     * @param mode The mode to create the new file with.
     * @param data The data to store at the file's data node.
     * @return The Inode for the new file.
     */
    commitNewSync(path, type, mode, data = new Uint8Array()) {
        const env_16 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_16, this.store.transaction(), false);
            const parentPath = dirname(path), parent = this.findINodeSync(tx, parentPath);
            const fname = basename(path), listing = this.getDirListingSync(tx, parent, parentPath);
            /*
                The root always exists.
                If we don't check this prior to taking steps below,
                we will create a file with name '' in root should p == '/'.
            */
            if (path === '/') {
                throw ErrnoError.With('EEXIST', path, 'commitNew');
            }
            // Check if file already exists.
            if (listing[fname]) {
                throw ErrnoError.With('EEXIST', path, 'commitNew');
            }
            // Commit data.
            const node = new Inode();
            node.ino = this.addNewSync(tx, data, path);
            node.size = data.length;
            node.mode = mode | type;
            node.uid = credentials.uid;
            node.gid = credentials.gid;
            // Update and commit parent directory listing.
            listing[fname] = this.addNewSync(tx, node.data, path);
            tx.setSync(parent.ino, encodeDirListing(listing));
            tx.commitSync();
            return node;
        }
        catch (e_16) {
            env_16.error = e_16;
            env_16.hasError = true;
        }
        finally {
            __disposeResources(env_16);
        }
    }
    /**
     * Remove all traces of the given path from the file system.
     * @param path The path to remove from the file system.
     * @param isDir Does the path belong to a directory, or a file?
     * @todo Update mtime.
     */
    async remove(path, isDir) {
        const env_17 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_17, this.store.transaction(), true);
            const parent = dirname(path), parentNode = await this.findINode(tx, parent), listing = await this.getDirListing(tx, parentNode, parent), fileName = basename(path);
            if (!listing[fileName]) {
                throw ErrnoError.With('ENOENT', path, 'remove');
            }
            const fileIno = listing[fileName];
            // Get file inode.
            const fileNode = await this.getINode(tx, fileIno, path);
            // Remove from directory listing of parent.
            delete listing[fileName];
            if (!isDir && fileNode.toStats().isDirectory()) {
                throw ErrnoError.With('EISDIR', path, 'remove');
            }
            if (isDir && !fileNode.toStats().isDirectory()) {
                throw ErrnoError.With('ENOTDIR', path, 'remove');
            }
            await tx.set(parentNode.ino, encodeDirListing(listing));
            if (--fileNode.nlink < 1) {
                // remove file
                await tx.remove(fileNode.ino);
                await tx.remove(fileIno);
            }
            // Success.
            await tx.commit();
        }
        catch (e_17) {
            env_17.error = e_17;
            env_17.hasError = true;
        }
        finally {
            const result_9 = __disposeResources(env_17);
            if (result_9)
                await result_9;
        }
    }
    /**
     * Remove all traces of the given path from the file system.
     * @param path The path to remove from the file system.
     * @param isDir Does the path belong to a directory, or a file?
     * @todo Update mtime.
     */
    removeSync(path, isDir) {
        const env_18 = { stack: [], error: void 0, hasError: false };
        try {
            const tx = __addDisposableResource(env_18, this.store.transaction(), false);
            const parent = dirname(path), parentNode = this.findINodeSync(tx, parent), listing = this.getDirListingSync(tx, parentNode, parent), fileName = basename(path), fileIno = listing[fileName];
            if (!fileIno) {
                throw ErrnoError.With('ENOENT', path, 'remove');
            }
            // Get file inode.
            const fileNode = this.getINodeSync(tx, fileIno, path);
            // Remove from directory listing of parent.
            delete listing[fileName];
            if (!isDir && fileNode.toStats().isDirectory()) {
                throw ErrnoError.With('EISDIR', path, 'remove');
            }
            if (isDir && !fileNode.toStats().isDirectory()) {
                throw ErrnoError.With('ENOTDIR', path, 'remove');
            }
            // Update directory listing.
            tx.setSync(parentNode.ino, encodeDirListing(listing));
            if (--fileNode.nlink < 1) {
                // remove file
                tx.removeSync(fileNode.ino);
                tx.removeSync(fileIno);
            }
            // Success.
            tx.commitSync();
        }
        catch (e_18) {
            env_18.error = e_18;
            env_18.hasError = true;
        }
        finally {
            __disposeResources(env_18);
        }
    }
}
