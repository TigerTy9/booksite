const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const https = require('https');
const fs = require('fs');

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

// Temporary in-memory storage for users
let users = [];

// Serve static files like your HTML
app.use(express.static('docs'));

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
        res.redirect('/reward');  // Redirect to rewards page after login
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

    res.redirect('/login.html');
});

// Reward Route
app.get('/reward', (req, res) => {
    if (!req.session.user) {
        // If not logged in, show options to log in or sign up
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Access Reward</title>
            </head>
            <body>
                <h1>Welcome to the Reward Page</h1>
                <p>You must log in or create an account to unlock your reward.</p>
                <p>
                    <a href="/login.html">Log in</a><br>
                    <a href="/signup.html">Create an Account</a>
                </p>
            </body>
            </html>
        `);
    }

    // Inject user data into the reward page (e.g., username)
    const username = req.session.user.username;
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reward Page</title>
        </head>
        <body>
            <h1>Congratulations, ${username}!</h1>
            <p>You have successfully logged in and unlocked your reward!</p>
            <p>Thank you for participating in the challenge.</p>
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
