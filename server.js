require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- DATABASE ---------------- */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: true
  }
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
  res.send("Library API running on Render");
});

/* ---------------- BOOKS CRUD ---------------- */

// CREATE
app.post("/api/books", (req, res) => {
  const { title, author, category, isbn, availability } = req.body;

  if (!title || !isbn) {
    return res.status(400).json({ error: "Title and ISBN required" });
  }

  db.query(
    "SELECT 1 FROM Book WHERE ISBN = ?",
    [isbn],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length > 0)
        return res.status(400).json({ error: "ISBN already exists" });

      db.query(
        `INSERT INTO Book (Title, Author, Category, ISBN, Availability)
         VALUES (?, ?, ?, ?, ?)`,
        [title, author, category, isbn, availability ?? true],
        (err, result) => {
          if (err) return res.status(500).json({ error: "Insert failed" });
          res.status(201).json({ message: "Book added", id: result.insertId });
        }
      );
    }
  );
});

// READ ALL
app.get("/api/books", (req, res) => {
  db.query(
    `SELECT BookID AS id, Title AS title, Author AS author,
     Category AS category, ISBN AS isbn, Availability AS availability
     FROM Book`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "Fetch failed" });
      res.json(results);
    }
  );
});

// SEARCH
app.get("/api/books/search/:title", (req, res) => {
  db.query(
    `SELECT BookID AS id, Title AS title, Author AS author,
     Category AS category, ISBN AS isbn, Availability AS availability
     FROM Book WHERE Title LIKE ?`,
    [`%${req.params.title}%`],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Search failed" });
      res.json(results);
    }
  );
});

// UPDATE
app.put("/api/books/:id", (req, res) => {
  const { title, author, category, isbn, availability } = req.body;

  db.query(
    `UPDATE Book SET Title=?, Author=?, Category=?, ISBN=?, Availability=?
     WHERE BookID=?`,
    [title, author, category, isbn, availability, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Update failed" });
      if (!result.affectedRows)
        return res.status(404).json({ error: "Book not found" });
      res.json({ message: "Book updated" });
    }
  );
});

// DELETE
app.delete("/api/books/:id", (req, res) => {
  db.query(
    "DELETE FROM Book WHERE BookID=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Delete failed" });
      if (!result.affectedRows)
        return res.status(404).json({ error: "Book not found" });
      res.json({ message: "Book deleted" });
    }
  );
});

/* ---------------- MEMBERS CRUD ---------------- */

app.post("/api/members", (req, res) => {
  const { name, address, contact } = req.body;
  if (!name || !contact)
    return res.status(400).json({ error: "Name & contact required" });

  db.query(
    "INSERT INTO Members (Name, Address, Contact) VALUES (?, ?, ?)",
    [name, address, contact],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Insert failed" });
      res.status(201).json({ message: "Member added", id: result.insertId });
    }
  );
});

app.get("/api/members", (req, res) => {
  db.query("SELECT * FROM Members", (err, results) => {
    if (err) return res.status(500).json({ error: "Fetch failed" });
    res.json(results);
  });
});

app.put("/api/members/:id", (req, res) => {
  const { name, address, contact } = req.body;

  db.query(
    "UPDATE Members SET Name=?, Address=?, Contact=? WHERE MemberID=?",
    [name, address, contact, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Update failed" });
      if (!result.affectedRows)
        return res.status(404).json({ error: "Member not found" });
      res.json({ message: "Member updated" });
    }
  );
});

app.delete("/api/members/:id", (req, res) => {
  db.query(
    "DELETE FROM Members WHERE MemberID=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Delete failed" });
      if (!result.affectedRows)
        return res.status(404).json({ error: "Member not found" });
      res.json({ message: "Member deleted" });
    }
  );
});

/* ---------------- ISSUES / RETURNS ---------------- */

app.post("/api/issues", (req, res) => {
  const { bookId, memberId, issueDate } = req.body;

  db.query(
    `INSERT INTO Issues (BookID, MemberID, IssueDate, DueDate)
     VALUES (?, ?, ?, DATE_ADD(?, INTERVAL 15 DAY))`,
    [bookId, memberId, issueDate, issueDate],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Issue failed" });

      db.query("UPDATE Book SET Availability=FALSE WHERE BookID=?", [bookId]);
      res.status(201).json({ message: "Book issued", id: result.insertId });
    }
  );
});

app.get("/api/issues", (req, res) => {
  db.query(
    `SELECT i.IssueID, b.Title, m.Name,
     DATE_FORMAT(i.IssueDate,'%Y-%m-%d') IssueDate,
     DATE_FORMAT(i.DueDate,'%Y-%m-%d') DueDate
     FROM Issues i
     JOIN Book b ON i.BookID=b.BookID
     JOIN Members m ON i.MemberID=m.MemberID`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "Fetch failed" });
      res.json(results);
    }
  );
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API running on port ${PORT}`)
);
