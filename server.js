const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 3000;

// SSL certificate and key (update these paths with your actual file locations)
const privateKey = fs.readFileSync('certs/private.key.pem', 'utf8');
const certificate = fs.readFileSync('certs/domain.cert.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup session handling
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files like your HTML
app.use(express.static('docs'));

// Helper function to get the user file path
const getUserFilePath = (username) => path.join(__dirname, 'users', `${username}.json`);

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const userFilePath = getUserFilePath(username);

    if (!fs.existsSync(userFilePath)) {
        return res.send('User not found');
    }

    const user = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);

    if (match) {
        req.session.user = user;
        res.redirect('/challenge.html');  // Redirect to challenge page after login
    } else {
        res.send('Incorrect password');
    }
});

// Sign Up Route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
        username,
        password: hashedPassword,
        challengeCode: null // Initially, no code has been entered
    };

    // Save the user to a JSON file
    fs.writeFileSync(getUserFilePath(username), JSON.stringify(user));

    res.redirect('/login.html');
});

// Challenge Route - Users must input the correct code
app.post('/submit-code', (req, res) => {
    const { username, code } = req.body;

    const userFilePath = getUserFilePath(username);

    if (!fs.existsSync(userFilePath)) {
        return res.send('User not found');
    }

    const user = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

    // Store the challenge code in the user's data
    user.challengeCode = code;

    // Save the updated user data
    fs.writeFileSync(userFilePath, JSON.stringify(user));

    res.redirect('/reward-chapter-6.html');  // Redirect to protected reward page
});

// Protected Reward Page Route
app.get('/reward-chapter-6', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');  // Redirect to login if not logged in
    }

    const userFilePath = getUserFilePath(req.session.user.username);

    if (!fs.existsSync(userFilePath)) {
        return res.send('User data not found');
    }

    const user = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

    // Check if the user has entered the correct challenge code
    if (user.challengeCode !== 'correct-code') {
        return res.send('You have not completed the challenge correctly.');
    }

    // If the code is correct, display the reward page
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reward Chapter 6</title>
        </head>
        <body>
            <h1>Congratulations, ${req.session.user.username}!</h1>
            <p>You have successfully completed the challenge and unlocked Chapter 6!</p>
            <a href="/logout">Logout</a>
        </body>
        </html>
    `);
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login.html');
    });
});

// Start HTTPS server
https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
