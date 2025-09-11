const express = require('express'); //Framwork for APIs Handle HTTP requests
const bodyParser = require('body-parser'); //Reads JSON requests from frontend
const mysql = require('mysql2'); // MYSQL driver (connector)
const cors = require('cors');  // Cross origin request server

// Initialize app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Use environment variables supplied by Railway in production
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  timezone: process.env.DB_TIMEZONE || '+00:00' // optional: set if needed
});

//Make sure SQL is connected
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

app.get('/', (req,res) => res.json({ ok: true }));

// ----------------- BOOKS CRUD -----------------

// CREATE - Add new book
app.post('/api/books', (req, res) => {
  const { title, author, category, isbn, availability } = req.body;

  if (!title || !isbn) {
    return res.status(400).json({ error: 'Title and ISBN are required' });
  }
  
  const sql2 = `
    SELECT * FROM Book WHERE ISBN = ?  
  `
  db.query(sql2, [isbn], (err, results) => {
    if(err){
      console.log("ISBN Exist!");
      return;
    }
  });
  const sql = `
    INSERT INTO Book (Title, Author, Category, ISBN, Availability)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, author, category, isbn, availability ?? true], (err, result) => {
    if (err) {
      console.error('Error inserting book:', err);
      return res.status(500).json({ error: 'Failed to add book' });
    }

     if (result.affectedRows === 0) {
    return res.status(400).json({ message: 'ISBN already exists. Book not added.' });
    
  }

    res.status(201).json({ message: 'Book added successfully', bookId: result.insertId });
  });
});

// READ - Get all books
app.get('/api/books', (req, res) => {
  db.query(
    'SELECT BookID AS id, Title AS title, Author AS author, Category AS category, ISBN AS isbn, Availability AS availability FROM Book',
    (err, results) => {
      if (err) {
        console.error('Error fetching books:', err);
        return res.status(500).json({ error: 'Failed to fetch books' });
      }
      res.json(results);
    }
  );
});

app.get('/api/available-books', (req, res) => {
  db.query(
    'SELECT BookID AS id, Title AS title, Author AS author, Category AS category, ISBN AS isbn FROM AvailableBooks',
    (err, results) => {
      if (err) {
        console.error('Error fetching books:', err);
        return res.status(500).json({ error: 'Failed to fetch books' });
      }
      res.json(results);
    }
  );
});

// SEARCH - Search Issues by option
app.get('/api/books/:title', (req, res) => {
   const title = req.params.title; 

  let sql = `SELECT BookID AS id, Title AS title, Author AS author, Category AS category, ISBN AS isbn, Availability AS availability FROM Book WHERE Title LIKE ?`

  db.query(sql, [`%${title}%`], (err, results) => {
    if (err) {
      console.error("❌ Error executing search:", err);
      return res.status(500).json({ error: "Failed to search data" });
    }
    res.json(results);
  });
});

// UPDATE - Update book
app.put('/api/books/:id', (req, res) => {
  const { title, author, category, isbn, availability } = req.body;

  const sql = `
    UPDATE Book
    SET Title = ?, Author = ?, Category = ?, ISBN = ?, Availability = ?
    WHERE BookID = ?
  `;

  db.query(sql, [title, author, category, isbn, availability, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating book:', err);
      return res.status(500).json({ error: 'Failed to update book' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book updated successfully' });
  });
});

// DELETE - Delete book
app.delete('/api/books/:id', (req, res) => {
  const sql = 'DELETE FROM Book WHERE BookID = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting book:', err);
      return res.status(500).json({ error: 'Failed to delete book' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  });
});

// ----------------- MEMBERS CRUD -----------------

// CREATE - Add new member
app.post('/api/members', (req, res) => {
  const { name, address, contact } = req.body;

  if (!name || !contact) {
    return res.status(400).json({ error: 'Name and Contact are required' });
  }

  const sql = `
    INSERT INTO Members (Name, Address, Contact)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [name, address, contact], (err, result) => {
    if (err) {
      console.error('Error inserting member:', err);
      return res.status(500).json({ error: 'Failed to add member' });
    }
    res.status(201).json({ message: 'Member added successfully', memberId: result.insertId });
  });
});

// READ - Get all members
app.get('/api/members', (req, res) => {
  db.query(
    'SELECT MemberID, Name, Address, Contact FROM Members',
    (err, results) => {
      if (err) {
        console.error('Error fetching members:', err);
        return res.status(500).json({ error: 'Failed to fetch members' });
      }
      res.json(results);
    }
  );
});

// UPDATE - Update member
app.put('/api/members/:id', (req, res) => {
  const { name, address, contact } = req.body;

  const sql = `
    UPDATE Members
    SET Name = ?, Address = ?, Contact = ?
    WHERE MemberID = ?
  `;

  db.query(sql, [name, address, contact, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating member:', err);
      return res.status(500).json({ error: 'Failed to update member' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member updated successfully' });
  });
});

// DELETE - Delete member
app.delete('/api/members/:id', (req, res) => {
  const sql = 'DELETE FROM Members WHERE MemberID = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting member:', err);
      return res.status(500).json({ error: 'Failed to delete member' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member deleted successfully' });
  });
});

// ----------------- ISSUE CRUD -----------------

// CREATE - Issue a new book
app.post('/api/issues', (req, res) => {
  const { bookId, memberId, issueDate } = req.body;

  if (!bookId || !memberId || !issueDate) {
    return res.status(400).json({ error: 'Book ID, Member ID, and Issue Date are required' });
  }

  const sql = `
    INSERT INTO Issues (BookID, MemberID, IssueDate, DueDate)
    VALUES (?, ?, ?, DATE_ADD(?, INTERVAL 15 DAY))
  `;

  db.query(sql, [bookId, memberId, issueDate, issueDate], (err, result) => {
    if (err) {
      console.error('Error issuing book:', err);
      return res.status(500).json({ error: 'Failed to issue book' });
    }

    // 🔹 Mark the book as unavailable
    db.query('UPDATE Book SET Availability = FALSE WHERE BookID = ?', [bookId]);

    res.status(201).json({ message: 'Book issued successfully', issueId: result.insertId });
  });
});


// READ - Get all issues
app.get('/api/issues', (req, res) => {
  const sql = `
    SELECT 
      i.IssueID,
      i.BookID,
      b.Title ,
      i.MemberID,
      m.Name ,
      DATE_FORMAT(i.IssueDate, '%Y-%m-%d') AS IssueDate,
      DATE_FORMAT(i.DueDate, '%Y-%m-%d') AS DueDate
    FROM Issues i
    JOIN Book b ON i.BookID = b.BookID
    JOIN Members m ON i.MemberID = m.MemberID
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching issues:', err);
      return res.status(500).json({ error: 'Failed to fetch issues' });
    }
    res.json(results);
  });
});


// UPDATE - Update member
app.put('/api/issues/:id', (req, res) => {
  const { bookId, memberId, dueDate } = req.body;

  const sql = `
    UPDATE Issues
    SET BookID = ?, MemberID = ?, DueDate = ?
    WHERE IssueID = ?
  `;

  db.query(sql, [bookId, memberId, dueDate, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating issue:', err);
      return res.status(500).json({ error: 'Failed to update issue' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Issue not found' });
    res.json({ message: 'Issue updated successfully' });
  });
});

// RETURN - Mark book as returned instead of deleting
// DELETE - Return book (move from Issues -> Returns)
// DELETE - Return book (move Issue -> ReturnedBooks)
app.delete('/api/issues/:id', (req, res) => {
  const issueId = req.params.id;

  // Step 1: Get issue details
  const getIssueSql = 'SELECT * FROM Issues WHERE IssueID = ?';
  db.query(getIssueSql, [issueId], (err, results) => {
    if (err) {
      console.error('Error fetching issue:', err);
      return res.status(500).json({ error: 'Failed to fetch issue' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = results[0];

    // Step 2: Calculate fine
    const today = new Date();
    const dueDate = new Date(issue.DueDate);
    let fine = 0;
    if (today > dueDate) {
      const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 10; // Rs.10 per late day
    }

    // Step 3: Insert into ReturnedBooks FIRST
    const insertReturnSql = `
      INSERT INTO ReturnedBooks (IssueID, BookID, MemberID, ReturnDate, Fine)
      VALUES (?, ?, ?, CURDATE(), ?)
    `;
    db.query(insertReturnSql, [issue.IssueID, issue.BookID, issue.MemberID, fine], (err) => {
      if (err) {
        console.error('Error inserting into ReturnedBooks:', err);
        return res.status(500).json({ error: 'Failed to insert return record' });
      }

      // Step 4: Delete from Issues AFTER inserting return
      const deleteSql = 'DELETE FROM Issues WHERE IssueID = ?';
      db.query(deleteSql, [issueId], (err) => {
        if (err) {
          console.error('Error deleting issue:', err);
          return res.status(500).json({ error: 'Failed to delete issue' });
        }

        // Step 5: Mark book as available
        const updateBookSql = 'UPDATE Book SET Availability = TRUE WHERE BookID = ?';
        db.query(updateBookSql, [issue.BookID], (err) => {
          if (err) {
            console.error('Error updating book availability:', err);
            return res.status(500).json({ error: 'Failed to update book availability' });
          }

          res.json({ 
            message: `Book returned successfully! Fine: Rs.${fine}`, 
            fine 
          });
        });
      });
    });
  });
});

app.get('/api/returns', (req, res) => {
  const sql = `
    SELECT 
      r.ReturnID,
      r.IssueID,
      r.BookID,
      b.Title,
      r.MemberID,
      m.Name,
      DATE_FORMAT(r.ReturnDate, '%Y-%m-%d') AS ReturnDate,
      r.Fine
    FROM ReturnedBooks r
    JOIN Book b ON r.BookID = b.BookID
    JOIN Members m ON r.MemberID = m.MemberID
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching returned books:', err);
      return res.status(500).json({ error: 'Failed to fetch returned books' });
    }
    res.json(results);
  });
});

app.get('/api/returns/:id', (req, res) => {
   const id = req.params.id; 

  let sql = `
      SELECT 
      r.ReturnID,
      r.IssueID,
      r.BookID,
      b.Title,
      r.MemberID,
      m.Name,
      DATE_FORMAT(r.ReturnDate, '%Y-%m-%d') AS ReturnDate,
      r.Fine
    FROM ReturnedBooks r
    JOIN Book b ON r.BookID = b.BookID
    JOIN Members m ON r.MemberID = m.MemberID
    WHERE r.MemberID = ?`

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Error executing search:", err);
      return res.status(500).json({ error: "Failed to search data" });
    }
    res.json(results);
  });
});

// ----------------- SERVER -----------------
const PORT = process.env.PORT || 3000;
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
