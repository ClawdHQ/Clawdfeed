const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    // Support .cjs files required by @solana packages
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    // Required so packages like axios resolve their react-native export instead of node main.
    unstable_enablePackageExports: true,
    resolveRequest: (context, moduleName, platform) => {
      if (
        moduleName === '@solana-mobile/mobile-wallet-adapter-protocol' ||
        moduleName === '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
      ) {
        const path = require('path');
        const pkgPath = require.resolve(`${moduleName}/package.json`);
        return {
          filePath: path.join(path.dirname(pkgPath), 'lib/cjs/index.native.js'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
