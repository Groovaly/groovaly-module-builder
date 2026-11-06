// Prints the hash to paste into PASSWORD_SHA256 in src/cobra/config.ts.
// Usage: npm run cobra:password -- "new password"
import { createHash } from 'node:crypto';

const SALT = 'groovaly-cobra-v1:'; // must match PASSWORD_SALT in src/cobra/config.ts
const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run cobra:password -- "new password"');
  process.exit(1);
}
console.log(createHash('sha256').update(SALT + password).digest('hex'));
