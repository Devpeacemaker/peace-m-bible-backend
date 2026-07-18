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



  await pool.query(`

    CREATE TABLE IF NOT EXISTS payments (

      id SERIAL PRIMARY KEY,

      phone TEXT NOT NULL,

      plan TEXT NOT NULL,

      amount INTEGER NOT NULL,

      checkout_id TEXT UNIQUE,

      status TEXT DEFAULT 'pending',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

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

    [

      expiry,

      phone

    ]

  );


  return await getUser(phone);

}





async function premiumValid(phone) {

  const user = await getUser(phone);


  if (!user) return false;


  if (!user.premium) return false;


  if (!user.expiry) return false;



  const valid =
      new Date(user.expiry) > new Date();



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





// PAYMENT FUNCTIONS


async function addPayment(payment) {


  const result = await pool.query(

    `INSERT INTO payments

    (phone,plan,amount,checkout_id,status)

    VALUES($1,$2,$3,$4,$5)

    RETURNING *`,

    [

      payment.phone,

      payment.plan,

      payment.amount,

      payment.checkout_id,

      "pending"

    ]

  );


  return result.rows[0];

}





async function updatePaymentStatus(
  checkout_id,
  status
) {


  await pool.query(

    `UPDATE payments

     SET status=$1

     WHERE checkout_id=$2`,

    [

      status,

      checkout_id

    ]

  );

}





async function getPayments() {


  const result =
      await pool.query(

    `SELECT * FROM payments

     ORDER BY created_at DESC`

  );


  return result.rows;

}





async function getPayment(id) {


  const result =
      await pool.query(

    "SELECT * FROM payments WHERE id=$1",

    [id]

  );


  return result.rows[0] || null;

}


async function getRevenueSummary() {

  const result = await pool.query(`
    SELECT

      COUNT(*) FILTER (
        WHERE LOWER(status)='completed'
      ) AS completed_payments,

      COALESCE(
        SUM(amount) FILTER (
          WHERE LOWER(status)='completed'
        ),
        0
      ) AS total_revenue,

      COUNT(*) FILTER (
        WHERE LOWER(status)='pending'
      ) AS pending_payments,

      COUNT(*) FILTER (
        WHERE LOWER(status)='failed'
           OR LOWER(status)='cancelled'
      ) AS failed_payments

    FROM payments
  `);

  return result.rows[0];

}

module.exports = {
  addUser,
  getUser,
  activatePremium,
  premiumValid,
  addPayment,
  updatePaymentStatus,
  getPayments,
  getRevenueSummary,
};
