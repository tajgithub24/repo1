const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const dbConfig = {
  host: '127.0.0.1',
  port: 6446,
  user: 'root',
  password: 'Root@1234',
  multipleStatements: true
};

const DB_NAME = 'test_db';
const TABLE_NAME = 'test_table';

// Create DB and table if not exist
async function initializeDB() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await conn.query(`USE ${DB_NAME}`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);
    console.log(`✅ Database '${DB_NAME}' and table '${TABLE_NAME}' are ready`);
    await conn.end();
  } catch (err) {
    console.error('❌ Error initializing DB:', err.message);
    process.exit(1);
  }
}

app.get('/', (req, res) => {
  res.send('✅ MySQL HA Test App is running');
});

app.post('/insert', async (req, res) => {
  const name = req.body.name;
  if (!name) return res.status(400).json({ error: 'Missing "name" in JSON body' });

  try {
    const conn = await mysql.createConnection({ ...dbConfig, database: DB_NAME });
    await conn.query(`INSERT INTO ${TABLE_NAME} (name) VALUES (?)`, [name]);
    await conn.end();
    res.json({ message: '✅ Inserted successfully' });
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/data', async (req, res) => {
  try {
    const conn = await mysql.createConnection({ ...dbConfig, database: DB_NAME });
    const [rows] = await conn.query(`SELECT id, name FROM ${TABLE_NAME}`);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(5000, async () => {
  console.log('🚀 Server running on http://localhost:5000');
  await initializeDB();
});
