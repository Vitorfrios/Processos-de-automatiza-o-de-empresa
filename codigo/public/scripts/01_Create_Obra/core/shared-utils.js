// core/shared-utils.js
export function attachModuleToWindow(module) {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function') {
            window[key] = module[key];
        }
    });
}