const { defaults, paramsCompliant } = require('./params');
const scryptsy = require('scryptsy');

exports.scrypt = function(password, salt, keylen, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = defaults;
  }
  if (!options) {
    options = defaults;
  }
  const { N, r, p } = paramsCompliant({ keylen, options });
  const promise = scryptsy.async(password, salt, N, r, p, keylen);
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
  return scryptsy(password, salt, N, r, p, keylen);
};
