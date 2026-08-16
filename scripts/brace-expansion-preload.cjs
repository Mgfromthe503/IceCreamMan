// scripts/brace-expansion-preload.cjs
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain) {
  if (request === 'brace-expansion') {
    return require.resolve('./node_modules/.pnpm/brace-expansion@2.1.3/node_modules/brace-expansion/index.js');
  }
  return originalResolveFilename.apply(this, arguments);
};