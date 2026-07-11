const express = require("express");
const axios = require("axios");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY =
  "sk_ea6fa5e65d2dc2baf13d7bb6c013c3bac4fc02f9caff820579903cd19da07692";

// ============================
// CREATE ACCOUNT
// ============================

app.post("/register", (req, res) => {
  const user = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    premium: false,
    expiry: null,
  };

  db.addUser(user);

  res.json({
    success: true,
    message: "Account created successfully.",
    user,
  });
});

// ============================
// GET USER
// ============================

app.get("/user/:phone", (req, res) => {
  const user = db.getUser(req.params.phone);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  res.json(user);
});

// ============================
// STK PUSH
// ============================

app.post("/stkpush", async (req, res) => {
  try {
    const response = await axios.post(
      "https://makamescopay.com/api/payments/stkpush",
      {
        phoneNumber: req.body.phoneNumber,
        amount: req.body.amount,
        accountReference: req.body.accountReference,
        transactionDesc: req.body.transactionDesc,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (e) {
    res.status(500).json({
      error: e.response?.data ?? e.message,
    });
  }
});

// ============================
// PAYMENT STATUS
// ============================

app.get("/status/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://makamescopay.com/api/payments/status/${req.params.id}`,
      {
        headers: {
          "X-API-Key": API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (e) {
    res.status(500).json({
      error: e.response?.data ?? e.message,
    });
  }
});

// ============================
// ACTIVATE PREMIUM
// ============================

app.post("/activate", (req, res) => {
  const phone = req.body.phone;
  const plan = req.body.plan;

  let months = 2;

  if (plan === "6 Months") {
    months = 6;
  }

  if (plan === "1 Year") {
    months = 12;
  }

  const user = db.activatePremium(phone, months);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  res.json({
    success: true,
    user,
  });
});

// ============================
// CHECK PREMIUM
// ============================

app.get("/premium/:phone", (req, res) => {
  const premium = db.premiumValid(req.params.phone);

  res.json({
    premium,
  });
});

app.listen(3000, () => {
  console.log("Peace M Bible backend running on port 3000");
});
