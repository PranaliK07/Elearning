// Manually set env vars for debug BEFORE requiring models
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'learning1_db';
process.env.DB_PORT = '3306';

const { sequelize } = require('./server/models');

async function check() {
  try {
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('Tables:', results);

    for (const row of results) {
      const tableName = Object.values(row)[0];
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${tableName}`);
      console.log(`\nTable: ${tableName}`);
      console.log('Columns:', columns.map(c => c.Field));
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
