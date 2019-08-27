function isPositiveInteger(v) {
  if (v === parseInt(v, 10) && v > 0) {
    return true;
  }
  return false;
}

// See: https://github.com/nodejs/node/blob/master/lib/internal/crypto/scrypt.js
exports.defaults = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 << 20
};

exports.getParams = function(options) {
  if (options === exports.defaults) {
    return options;
  }
  const _options = {};
  for (const [long, short] of [
    ['cost', 'N'],
    ['blockSize', 'r'],
    ['parallelization', 'p']
  ]) {
    if (long in options) {
      if (short in options) {
        throw new Error(`cannot specify both ${long} and ${short}`);
      }
      _options[short] = options[long];
    } else if (short in options) {
      _options[short] = options[short];
    } else {
      _options[short] = exports.defaults[short];
    }
  }
  if ('maxmem' in options) {
    _options.maxmem = options.maxmem;
  } else {
    _options.maxmem = exports.defaults.maxmem;
  }
  return _options;
};

exports.paramsCompliant = function({ keylen, options }) {
  const { N, r, p, maxmem } = exports.getParams(options);
  const mustBePosInt = `must be a positive integer. ${see}`;
  if (!isPositiveInteger(N)) {
    throw new RangeError(`N (cost) ${mustBePosInt}`);
  }
  if (!isPositiveInteger(r)) {
    throw new RangeError(`r (blockSize) ${mustBePosInt}`);
  }
  if (!isPositiveInteger(p)) {
    throw new RangeError(`p (parallelization) ${mustBePosInt}`);
  }
  if (!isPositiveInteger(keylen)) {
    throw new RangeError(`keylen ${mustBePosInt}`);
  }
  const see = 'See https://tools.ietf.org/html/rfc7914#section-2';
  if (N < 1 || N % 2 || N >= 2 ** ((128 * r) / 8)) {
    throw new RangeError(
      `N (cost) must be larger than 1, a power of 2, and less than 2^(128 * r / 8). ${see}`
    );
  } else if (p > ((2 ** 32 - 1) * 32) / (128 * r)) {
    throw new RangeError(
      `p (parallelization) must be less than or equal to ((2^32-1) * 32) / (128 * r). ${see}`
    );
  } else if (keylen > (2 ** 32 - 1) * 32) {
    throw new RangeError(
      `keylen must be less than or equal to (2^32 - 1) * 32. ${see}`
    );
  }
  return { N, r, p, maxmem };
};
