const dc = require('../controllers/doubtController');
console.log('Keys in doubtController:', Object.keys(dc));
for (const key in dc) {
  console.log(`${key}: ${typeof dc[key]}`);
}
