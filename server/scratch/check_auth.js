const auth = require('../middleware/auth');
console.log('Keys in auth:', Object.keys(auth));
for (const key in auth) {
  console.log(`${key}: ${typeof auth[key]}`);
}
