const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup session handling
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Temporary in-memory storage for users
let users = [];

// Serve static files like your HTML
app.use(express.static('docs'));

// Login Route (updated to use Node.js crypto module)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    
    if (!user) {
        return res.send('User not found');
    }

    // Hash the entered password and compare it to the stored hash
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (hashedPassword === user.password) {
        req.session.user = user;
        res.redirect('/reward.html');  // Redirect to rewards page after login
    } else {
        res.send('Incorrect password');
    }
});

// Sign Up Route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user
    users.push({ username, password: hashedPassword });

    res.redirect('/login');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
