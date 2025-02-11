// eslint-disable-next-line @typescript-eslint/unbound-method
Promise.withResolvers ?? (Promise.withResolvers = function () {
    let _resolve, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _reject;
    const promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    });
    return { promise, resolve: _resolve, reject: _reject };
});
/*
    A polyfill for when these symbols are undefined.
    For some reason, NodeJS does not polyfill them in a VM context.
    Since jest uses a VM context for ESM, these need to be here.
*/
// @ts-expect-error 2540
Symbol['dispose'] ?? (Symbol['dispose'] = Symbol('Symbol.dispose'));
// @ts-expect-error 2540
Symbol['asyncDispose'] ?? (Symbol['asyncDispose'] = Symbol('Symbol.asyncDispose'));
export {};
