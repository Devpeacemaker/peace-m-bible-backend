require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const db = require("./database");

const app = express();


app.use(cors());

app.use(express.json());



const API_KEY = process.env.API_KEY;

const ADMIN_KEY = process.env.ADMIN_KEY;


// Admin security middleware

function adminAuth(req, res, next) {

  const key = req.headers["admin-key"];


  if (!key || key !== ADMIN_KEY) {

    return res.status(401).json({

      success: false,

      message: "Unauthorized admin access",

    });

  }


  next();

}



// ==========================
// CREATE ACCOUNT
// ==========================

app.post("/register", async (req, res) => {

  try {

    const user = {

      name: req.body.name,

      email: req.body.email,

      phone: req.body.phone,

      premium: false,

      expiry: null,

    };


    const savedUser =
        await db.addUser(user);



    res.json({

      success: true,

      message:
          "Account created successfully.",

      user: savedUser,

    });


  } catch (e) {


    res.status(500).json({

      success: false,

      message: e.message,

    });


  }

});





// ==========================
// GET USER
// ==========================

app.get("/user/:phone", async (req, res) => {


  try {


    const user =
        await db.getUser(
          req.params.phone
        );



    if (!user) {


      return res.status(404).json({

        success: false,

        message:
            "User not found.",

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
// ==========================
// STK PUSH PAYMENT
// ==========================

app.post("/stkpush", async (req, res) => {

  try {


    const response = await axios.post(

      "https://makamescopay.com/api/payments/stkpush",

      {

        phoneNumber:
            req.body.phoneNumber,

        amount:
            req.body.amount,

        accountReference:
            req.body.accountReference,

        transactionDesc:
            req.body.transactionDesc,

      },

      {

        headers: {

          "Content-Type":
              "application/json",

          "X-API-Key":
              API_KEY,

        },

      }

    );



    const checkoutId =
        response.data.checkoutRequestId;



    // Save payment for admin control

const checkoutId =
  response.data.checkoutRequestId;


await db.addPayment({

  phone: req.body.phoneNumber,

  plan: req.body.transactionDesc,

  amount: req.body.amount,

  checkout_id: checkoutId,

});



res.json({

  ...response.data,

  checkoutRequestId: checkoutId,

});


} catch (e) {

  res.status(500).json({

    error:
      e.response?.data ??
      e.message,

  });

}

});





// ==========================
// CHECK PAYMENT STATUS
// ==========================

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


    const paymentStatus =
      response.data.status ||
      response.data.paymentStatus ||
      "pending";


    // Update admin payment record

    await db.updatePaymentStatus(

      req.params.id,

      paymentStatus

    );



    res.json(response.data);



  } catch (e) {


    res.status(500).json({

      error:
        e.response?.data ??
        e.message,

    });


  }

});
// ==========================
// ACTIVATE PREMIUM
// ==========================

app.post("/activate", async (req, res) => {

  try {


    const phone =
        req.body.phone;


    const plan =
        req.body.plan;



    let months = 2;



    if (plan === "6 Months") {

      months = 6;

    }



    if (plan === "1 Year") {

      months = 12;

    }



    const user =
        await db.activatePremium(
          phone,
          months
        );



    if (!user) {


      return res.status(404).json({

        success: false,

        message:
            "User not found.",

      });


    }



    res.json({

      success: true,

      user,

    });



  } catch (e) {


    res.status(500).json({

      success: false,

      message:
          e.message,

    });


  }


});





// ==========================
// CHECK PREMIUM
// ==========================

app.get("/premium/:phone", async (req, res) => {


  try {


    const premium =
        await db.premiumValid(
          req.params.phone
        );



    res.json({

      premium,

    });



  } catch (e) {


    res.status(500).json({

      success: false,

      message:
          e.message,

    });


  }


});



// ==============================
// ADMIN VIEW PAYMENTS
// ==============================

app.get("/admin/payments", adminAuth, async (req, res) => {

  try {

    const payments = await db.getPayments();


    res.json({

      success: true,

      payments,

    });


  } catch (e) {

    res.status(500).json({

      success: false,

      message: e.message,

    });

  }

});



// ==============================
// ADMIN MANUAL PREMIUM ACTIVATION
// ==============================

app.post("/admin/activate", adminAuth, async (req, res) => {

  try {

    const {
      phone,
      plan
    } = req.body;


    let months = 2;


    if (plan === "6 Months") {
      months = 6;
    }


    if (plan === "1 Year") {
      months = 12;
    }



    const user =
      await db.activatePremium(
        phone,
        months
      );



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }



    res.json({

      success: true,

      message:
      "Premium activated successfully",

      user,

    });



  } catch (e) {

    res.status(500).json({

      success: false,

      message: e.message,

    });

  }

});
app.get("/admin/revenue", adminAuth, async (req,res)=>{

  try {

    const summary =
      await db.getRevenueSummary();


    res.json({
      success:true,
      summary
    });


  } catch(e){

    res.status(500).json({
      success:false,
      message:e.message
    });

  }

});


app.get("/admin/debug", adminAuth, async (req, res) => {

  try {

    const payments = await db.getPayments();

    res.json(payments);

  } catch (e) {

    res.status(500).json({
      message: e.message,
    });

  }

});
// ==========================
// AI BIBLE ASSISTANT
// ==========================

app.post("/ai", async (req, res) => {

  try {

    const { question } = req.body;


    if (!question) {

      return res.status(400).json({

        success: false,

        message:
            "Question is required.",

      });

    }



    const response = await axios.post(

      "https://api.groq.com/openai/v1/chat/completions",

      {

        model:
            "llama-3.3-70b-versatile",

        messages: [

          {

            role:
                "system",

            content:
              "You are PEACE M Bible AI. Answer ONLY Bible-related questions. Base your answers on Scripture. Quote Bible verses where appropriate.",

          },


          {

            role:
                "user",

            content:
                question,

          }

        ],


        temperature: 0.4,


        max_tokens: 1024,


      },


      {

        headers: {

          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`,

          "Content-Type":
              "application/json",

        },

      }

    );



    res.json({

      success: true,

      answer:
        response.data.choices[0]
        .message.content,

    });



  } catch (e) {


    console.error(
      e.response?.data || e.message
    );


    res.status(500).json({

      success: false,

      message:
          e.message,

    });


  }

});





// ==========================
// START SERVER
// ==========================

const PORT =
    process.env.PORT || 3000;



app.listen(PORT, () => {

  console.log(
    `Peace M Bible backend running on port ${PORT}`
  );

});
