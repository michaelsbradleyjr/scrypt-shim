const { defaults, getParams, paramsCompliant } = require('./params');
const semver = require('semver');

const NODE_MIN_VER_WITH_BUILTIN_SCRYPT = '10.5.0';

const colorizeYellow = '\x1b[33m%s\x1b[0m';
const colorizeRed = '\x1b[31m%s\x1b[0m';

const hasNodeBuiltin = semver
  .Range('>=' + NODE_MIN_VER_WITH_BUILTIN_SCRYPT)
  .test(process.version);

let scryptPkg;

function tryScryptPkg() {
  let scryptPkgPath;
  try {
    scryptPkgPath = require.resolve('scrypt');
  } catch (err) {
    scryptPkgPath = null;
  }
  if (scryptPkgPath) {
    try {
      scryptPkg = require(scryptPkgPath);
    } catch (err) {
      console.warn(
        colorizeYellow,
        'scrypt-shim encountered an error when loading the scrypt package:'
      );
      console.warn(colorizeRed, err.message || err);
      console.warn(
        colorizeYellow,
        `${
          hasNodeBuiltin ? 'built-in scrypt' : 'scryptsy'
        } will be used instead`
      );
    }
  }
  return scryptPkg;
}

if (tryScryptPkg()) {
  exports.scrypt = function(password, salt, keylen, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = defaults;
    }
    if (!options) {
      options = defaults;
    }
    const { N, r, p } = paramsCompliant({ keylen, options });
    const promise = scryptPkg.hash(password, { N, r, p }, keylen, salt);
    if (!callback) {
      return promise;
    }
    promise
      .then(key => {
        callback(null, key);
      })
      .catch(err => {
        callback(err);
      });
    return undefined;
  };

  exports.scryptSync = function(password, salt, keylen, options) {
    if (!options) {
      options = defaults;
    }
    const { N, r, p } = paramsCompliant({ keylen, options });
    return scryptPkg.hashSync(password, { N, r, p }, keylen, salt);
  };
} else if (hasNodeBuiltin) {
  const crypto = require('crypto');
  exports.scrypt = function(password, salt, keylen, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = defaults;
    }
    if (!options) {
      options = defaults;
    }
    const { N, r, p, maxmem } = getParams(options);
    let promise;
    if (!callback) {
      let resolve;
      let reject;
      promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      callback = (err, key) => {
        if (err) {
          try {
            paramsCompliant({ keylen, options });
          } catch (e) {
            err = e;
          }
          reject(err);
        }
        resolve(key);
      };
    } else {
      const cb = callback;
      callback = (err, key) => {
        if (err) {
          try {
            paramsCompliant({ keylen, options });
          } catch (e) {
            err = e;
          }
          cb(err);
        }
        cb(null, key);
      };
    }
    crypto.scrypt(password, salt, keylen, { N, r, p, maxmem }, callback);
    return promise; // will be undefined if caller supplied a callback
  };

  exports.scryptSync = function(password, salt, keylen, options) {
    if (!options) {
      options = defaults;
    }
    const { N, r, p, maxmem } = getParams(options);
    let key;
    try {
      key = crypto.scryptSync(password, salt, keylen, { N, r, p, maxmem });
    } catch (err) {
      if (paramsCompliant({ keylen, options })) {
        throw err;
      }
    }
    return key;
  };
} else {
  module.exports = require('./browser');
}
