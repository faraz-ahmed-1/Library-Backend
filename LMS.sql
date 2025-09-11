CREATE DATABASE librarydb;
USE librarydb;

CREATE TABLE Members (
    MemberID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255),
    Contact VARCHAR(15) UNIQUE
);

CREATE TABLE Book (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(150) NOT NULL,
    Author VARCHAR(100),
    Category VARCHAR(50),
    ISBN VARCHAR(13) NOT NULL UNIQUE,
    Availability BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_isbn CHECK (
        ISBN REGEXP '^[0-9]{13}$' 
        OR ISBN REGEXP '^[0-9]{9}[0-9Xx]$'
    )
);

CREATE TABLE Issues (
    IssueID INT AUTO_INCREMENT PRIMARY KEY,
    BookID INT NOT NULL,
    MemberID INT NOT NULL,
    IssueDate DATE NOT NULL,
    DueDate DATE NOT NULL,

    CONSTRAINT fk_book FOREIGN KEY (BookID) REFERENCES Book(BookID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_member FOREIGN KEY (MemberID) REFERENCES Members(MemberID) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ReturnedBooks (
    ReturnID INT AUTO_INCREMENT PRIMARY KEY,
    IssueID INT NOT NULL,
    BookID INT NOT NULL,
    MemberID INT NOT NULL,
    ReturnDate DATE NOT NULL,
    Fine DECIMAL(6,2) DEFAULT 0,

    CONSTRAINT fk_return_book FOREIGN KEY (BookID) REFERENCES Book(BookID) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_return_member FOREIGN KEY (MemberID) REFERENCES Members(MemberID) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE VIEW AvailableBooks AS
SELECT BookID, Title, Author, Category, ISBN
FROM Book
WHERE Availability = TRUE;

CREATE VIEW OverdueBooks AS
SELECT i.IssueID, b.Title, m.Name AS MemberName, i.DueDate
FROM Issues i
JOIN Book b ON i.BookID = b.BookID
JOIN Members m ON i.MemberID = m.MemberID
WHERE i.ReturnDate IS NULL AND i.DueDate < CURDATE();