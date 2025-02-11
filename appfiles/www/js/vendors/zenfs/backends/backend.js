import { ErrnoError, Errno } from '../error.js';
import { levenshtein } from '../utils.js';
/**
 * @internal
 */
export function isBackend(arg) {
    return arg != null && typeof arg == 'object' && 'isAvailable' in arg && typeof arg.isAvailable == 'function' && 'create' in arg && typeof arg.create == 'function';
}
/**
 * Checks that the given options object is valid for the file system options.
 * @internal
 */
export async function checkOptions(backend, opts) {
    if (typeof opts != 'object' || opts === null) {
        throw new ErrnoError(Errno.EINVAL, 'Invalid options');
    }
    // Check for required options.
    for (const [optName, opt] of Object.entries(backend.options)) {
        const providedValue = opts?.[optName];
        if (providedValue === undefined || providedValue === null) {
            if (!opt.required) {
                continue;
            }
            /* Required option not provided.
            if any incorrect options provided, which ones are close to the provided one?
            (edit distance 5 === close)*/
            const incorrectOptions = Object.keys(opts)
                .filter(o => !(o in backend.options))
                .map((a) => {
                return { str: a, distance: levenshtein(optName, a) };
            })
                .filter(o => o.distance < 5)
                .sort((a, b) => a.distance - b.distance);
            throw new ErrnoError(Errno.EINVAL, `${backend.name}: Required option '${optName}' not provided.${incorrectOptions.length > 0 ? ` You provided '${incorrectOptions[0].str}', did you mean '${optName}'.` : ''}`);
        }
        // Option provided, check type.
        const typeMatches = Array.isArray(opt.type) ? opt.type.indexOf(typeof providedValue) != -1 : typeof providedValue == opt.type;
        if (!typeMatches) {
            throw new ErrnoError(Errno.EINVAL, `${backend.name}: Value provided for option ${optName} is not the proper type. Expected ${Array.isArray(opt.type) ? `one of {${opt.type.join(', ')}}` : opt.type}, but received ${typeof providedValue}`);
        }
        if (opt.validator) {
            await opt.validator(providedValue);
        }
        // Otherwise: All good!
    }
}
/**
 * @internal
 */
export function isBackendConfig(arg) {
    return arg != null && typeof arg == 'object' && 'backend' in arg && isBackend(arg.backend);
}
