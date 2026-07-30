// Only used by Jest, to transpile jose's ESM-only build to CommonJS so it
// can be loaded inside Jest's module system (see jest.config.js's
// transformIgnorePatterns). The app itself is built by Strapi, not Babel.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
}
