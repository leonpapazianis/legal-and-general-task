// @nestjs/schedule uses globalThis.crypto (Web Crypto API) in Node 18.
// ts-jest doesn't expose it automatically — provide via Node's built-in.
if (typeof crypto === 'undefined') {
  global.crypto = require('crypto');
}
