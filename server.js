const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
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

// Sign Up Route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user
    users.push({ username, password: hashedPassword });

    res.redirect('/login');
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username);
    
    if (!user) {
        return res.send('User not found');
    }

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);

    if (match) {
        req.session.user = user;
        res.redirect('/reward.html');  // Redirect to rewards page after login
    } else {
        res.send('Incorrect password');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
