import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
function withTrailingSlash(value) {
    return value.endsWith('/') ? value : "".concat(value, "/");
}
function resolveBasePath() {
    var _a, _b;
    var explicitBase = (_a = process.env.PAGES_BASE_PATH) !== null && _a !== void 0 ? _a : process.env.VITE_BASE_PATH;
    if (explicitBase) {
        var normalized = explicitBase.startsWith('/') ? explicitBase : "/".concat(explicitBase);
        return withTrailingSlash(normalized);
    }
    if (process.env.GITHUB_ACTIONS === 'true') {
        var repositoryName = (_b = process.env.GITHUB_REPOSITORY) === null || _b === void 0 ? void 0 : _b.split('/')[1];
        if (repositoryName) {
            return "/".concat(repositoryName, "/");
        }
    }
    return '/';
}
export default defineConfig({
    base: resolveBasePath(),
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
    },
});
