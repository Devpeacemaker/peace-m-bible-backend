require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;

app.post("/register", async (req, res) => {
  try {
    const user = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      premium: false,
      expiry: null,
    };

    const savedUser = await db.addUser(user);

    res.json({
      success: true,
      message: "Account created successfully.",
      user: savedUser,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

app.get("/user/:phone", async (req, res) => {
  try {
    const user = await db.getUser(req.params.phone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json(user);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

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

app.post("/activate", async (req, res) => {
  try {
    const phone = req.body.phone;
    const plan = req.body.plan;

    let months = 2;

    if (plan === "6 Months") months = 6;
    if (plan === "1 Year") months = 12;

    const user = await db.activatePremium(phone, months);

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
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

app.get("/premium/:phone", async (req, res) => {
  try {
    const premium = await db.premiumValid(req.params.phone);

    res.json({
      premium,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

app.post("/ai", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are PEACE M Bible AI. Answer ONLY Bible-related questions. Base every answer on Scripture. Quote Bible verses where appropriate. If asked about non-Bible topics, politely explain that you are a Bible assistant.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://peace-m-bible-backend.onrender.com",
          "X-Title": "Peace M Bible",
        },
      }
    );

    res.json({
      success: true,
      answer: response.data.choices[0].message.content,
    });
  } catch (e) {
    console.error(e.response?.data || e.message);

    res.status(500).json({
      success: false,
      message: e.response?.data || e.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Peace M Bible backend running on port ${PORT}`);
});
