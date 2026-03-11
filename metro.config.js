const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const nodeCoreModules = [
    'events', 'stream', 'crypto', 'http', 'https',
    'zlib', 'net', 'tls', 'fs', 'path', 'url', 'os'
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
    // 🌟 THE FIX: Only apply the Node.js/ws blocks to Native mobile builds
    if (platform === 'ios' || platform === 'android') {

        // 1. Block 'ws'
        if (moduleName === 'ws' || moduleName.startsWith('ws/')) {
            return { type: 'empty' };
        }

        // 2. Block Node core modules
        if (nodeCoreModules.includes(moduleName) || moduleName.startsWith('node:')) {
            return { type: 'empty' };
        }
    }

    // 3. Let Web (and Node SSR) resolve everything normally!
    return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_enablePackageExports = false;
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;