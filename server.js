require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

// ============================
// LOAD ENGLISH BIBLE
// ============================

const engBible = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "bibles",
      "eng.json"
    ),
    "utf8"
  )
);
// ============================
// ENGLISH BIBLE API
// ============================

app.get("/bible/eng/:book/:chapter", (req, res) => {
  try {
    const bookIndex = parseInt(req.params.book);
    const chapterIndex = parseInt(req.params.chapter);

    const book = engBible[bookIndex];

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const chapter = book.chapters[chapterIndex];

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    res.json({
      success: true,
      book: book.name,
      chapter: chapterIndex + 1,
      verses: chapter,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
});
// ============================
// SEARCH ENGLISH BIBLE
// ============================

app.get("/search/eng", (req, res) => {
  const query = (req.query.query || "")
    .toString()
    .toLowerCase();

  if (!query) {
    return res.json([]);
  }

  const results = [];

  engBible.forEach((book, bookIndex) => {
    book.chapters.forEach((chapter, chapterIndex) => {
      chapter.forEach((verse, verseIndex) => {
        if (verse.toLowerCase().includes(query)) {
          results.push({
            book: book.name,
            bookIndex,
            chapter: chapterIndex + 1,
            verse: verseIndex + 1,
            text: verse,
          });
        }
      });
    });
  });

  res.json(results);
});
// ============================
// SERVER
// ============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "Peace M Bible Backend",
    version: "1.0.0",
    status: "Running",
    endpoints: [
      "/register",
      "/user/:phone",
      "/stkpush",
      "/status/:id",
      "/activate",
      "/premium/:phone",
      "/bible/eng/:book/:chapter",
      "/search/eng"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Peace M Bible backend running on port ${PORT}`);
});
