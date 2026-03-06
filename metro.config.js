// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Preserve any upstream resolver (Expo sometimes sets one)
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, realModuleName, platform) => {
    // Colyseus SDK pulls `ws` → Node core `stream` (breaks RN). Use browser build.
    if (realModuleName === "ws") {
        return {
            filePath: require.resolve("isomorphic-ws/browser.js"),
            type: "sourceFile",
        };
    }

    // Colyseus httpie: force XHR implementation (RN-friendly)
    if (realModuleName.startsWith("@colyseus/httpie")) {
        return {
            filePath: path.resolve(
                __dirname,
                "node_modules/@colyseus/httpie/xhr/index.mjs"
            ),
            type: "sourceFile",
        };
    }

    // Fallback
    if (upstreamResolveRequest) {
        return upstreamResolveRequest(context, realModuleName, platform);
    }
    return context.resolveRequest(context, realModuleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
