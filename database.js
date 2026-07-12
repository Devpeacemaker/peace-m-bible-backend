const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      premium BOOLEAN DEFAULT FALSE,
      expiry TIMESTAMP NULL
    )
  `);

  console.log("Database initialized");
}

initialize().catch(console.error);

async function addUser(user) {
  const existing = await getUser(user.phone);

  if (existing) {
    return existing;
  }

  const result = await pool.query(
    `INSERT INTO users(name,email,phone,premium,expiry)
     VALUES($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      user.name,
      user.email,
      user.phone,
      false,
      null,
    ]
  );

  return result.rows[0];
}

async function getUser(phone) {
  const result = await pool.query(
    "SELECT * FROM users WHERE phone=$1",
    [phone]
  );

  return result.rows[0] || null;
}

async function activatePremium(phone, months) {
  const user = await getUser(phone);

  if (!user) return null;

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  await pool.query(
    `UPDATE users
     SET premium=true,
         expiry=$1
     WHERE phone=$2`,
    [expiry, phone]
  );

  return await getUser(phone);
}

async function premiumValid(phone) {
  const user = await getUser(phone);

  if (!user) return false;

  if (!user.premium) return false;

  if (!user.expiry) return false;

  const valid = new Date(user.expiry) > new Date();

  if (!valid) {
    await pool.query(
      `UPDATE users
       SET premium=false,
           expiry=NULL
       WHERE phone=$1`,
      [phone]
    );

    return false;
  }

  return true;
}

module.exports = {
  addUser,
  getUser,
  activatePremium,
  premiumValid,
};
