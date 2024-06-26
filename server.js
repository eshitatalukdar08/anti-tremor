const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
    secret: 'your-secret-key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true
}));

// Database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT, phone TEXT)");
});

// Helper function to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/');
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/profile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/connect', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'connect.html'));
});

app.get('/report.pdf', (req, res) => {
    const filePath = path.join(__dirname, 'report.pdf');
    res.download(filePath);
});

app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/signup', (req, res) => {
    const { username, password, email, phone } = req.body;
    db.run(`INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)`, [username, password, email, phone], function(err) {
        if (err) {
            return res.status(500).send("Error occurred while signing up");
        }
        req.session.user = { id: this.lastID, username, email, phone };
        res.redirect('/profile');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).send("Error occurred while logging in");
        }
        if (!row) {
            return res.status(400).send("Invalid username or password");
        }
        req.session.user = row;
        res.redirect('/profile');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error occurred while logging out");
        }
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


app.get('/admin', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) {
            return res.status(500).send("Error occurred while retrieving users");
        }
        res.json(rows);
    });
});



