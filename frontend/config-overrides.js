const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  config.resolve.fallback = {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
    assert: false,
    http: false,
    https: false,
    os: false,
    url: false,
    zlib: false,
  };

  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': path.resolve(__dirname, 'src/process/browser.js'),
  };

  config.resolve.extensionAlias = {
    '.js': ['.js', '.mjs'],
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  config.ignoreWarnings = [
    /Module not found: Error: Can't resolve 'process\/browser'/,
    /Module not found: Error: Can't resolve 'stream'/,
    /Module not found: Error: Can't resolve 'crypto'/,
    /Failed to parse source map/,
  ];

  return config;
};