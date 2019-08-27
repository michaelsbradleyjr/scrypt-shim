const semver = require('semver');

// Bump 10.5.0 to future 10.x.x once a 10.x release widens the maxmem range
// See: https://github.com/nodejs/node/pull/29316
const NODE_MIN_VERS_SCRYPT_RECOMMENDED = ['10.5.0', '12.8.0'];
const NODE_MIN_VER_WITH_BUILTIN_SCRYPT = '10.5.0';

// Any Node.js version < 12.0.0 is also compatible with the deprecated scrypt
// package so can recommend that option whenever recommending a Node.js upgrade
const canImprovePerformance = `
  You can improve the performance of scrypt by upgrading to Node.js version
  ${NODE_MIN_VERS_SCRYPT_RECOMMENDED.join(' or ')} or newer, or by installing
  the (deprecated) scrypt package in your project
`
  .split('\n')
  .map(line => line.trim())
  .filter(line => line)
  .join(' ');

const colorizeYellow = '\x1b[33m%s\x1b[0m';

const hasNodeBuiltin = semver
  .Range('>=' + NODE_MIN_VER_WITH_BUILTIN_SCRYPT)
  .test(process.version);

function tryScryptPkg() {
  let scryptPkgPath;
  try {
    scryptPkgPath = require.resolve('scrypt');
  } catch (err) {
    scryptPkgPath = null;
  }
  return scryptPkgPath;
}

if (!hasNodeBuiltin) {
  if (!tryScryptPkg()) {
    console.warn(colorizeYellow, canImprovePerformance);
  }
}
