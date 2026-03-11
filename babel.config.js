module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Remove any plugin that might conflict with class handling
        ],
    };
};