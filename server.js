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

// Challenge Route
app.get('/challenge', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Challenge</title>
        </head>
        <body>
            <h1>Enter the Challenge Code</h1>
            <form action="/challenge" method="POST">
                <input type="text" name="challengeCode" placeholder="Enter Code" required>
                <button type="submit">Submit</button>
            </form>
        </body>
        </html>
    `);
});

// Handle Challenge Code Submission
app.post('/challenge', (req, res) => {
    const { challengeCode } = req.body;
    const username = req.session.user ? req.session.user.username : null;

    if (!username) {
        return res.send('You must be logged in to submit the challenge.');
    }

    // Correct challenge code (You can make this dynamic if needed)
    const correctCode = '12345'; // Example of the correct code

    if (challengeCode === correctCode) {
        // Mark user as having solved the challenge by saving to a file
        const userFilePath = path.join(__dirname, 'users', `${username}.html`);
        const userFileContent = `
            <html>
                <head><title>User Data</title></head>
                <body>
                    <h1>${username} - Challenge Completed!</h1>
                    <p>You have entered the correct challenge code.</p>
                </body>
            </html>
        `;
        fs.writeFileSync(userFilePath, userFileContent);
        res.send('Correct code! You can now access the reward.');
    } else {
        res.send('Incorrect code! Please try again.');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userFilePath = path.join(__dirname, 'users', `${username}.html`);

    if (!fs.existsSync(userFilePath)) {
        return res.send('User not found.');
    }

    // In a real-world application, you'd use a hashed password stored in a file or database
    const user = fs.readFileSync(userFilePath, 'utf8');

    // Compare passwords using bcrypt
    const match = await bcrypt.compare(password, user.password);

    if (match) {
        req.session.user = { username };  // Store username in session
        res.redirect('/reward-chapter-6');  // Redirect to reward page after login
    } else {
        res.send('Incorrect password');
    }
});

// Reward Route (Protected - chapter 6)
app.get('/reward-chapter-6', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');  // Redirect to login if not logged in
    }

    const username = req.session.user.username;
    const userFilePath = path.join(__dirname, 'users', `${username}.html`);

    if (!fs.existsSync(userFilePath)) {
        return res.redirect('/challenge');  // Redirect if user hasn't completed the challenge
    }

    // User has completed the challenge and is logged in
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reward Chapter 6</title>
        </head>
        <body>
            <h1>Congratulations, ${username}!</h1>
            <p>You have unlocked Reward Chapter 6!</p>
            <p>Enjoy your reward.</p>
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

// Signup Route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Check if user already exists (based on their username)
    const userFilePath = path.join(__dirname, 'users', `${username}.html`);
    
    if (fs.existsSync(userFilePath)) {
        return res.send('Username already exists! Please choose a different one.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user data to the users folder (using their username as the file name)
    const userFileContent = `
        <html>
            <head><title>User Data</title></head>
            <body>
                <h1>${username} - Account Created!</h1>
                <p>Your account has been successfully created.</p>
                <p>Remember, your password is stored securely and cannot be retrieved.</p>
            </body>
        </html>
    `;
    
    fs.writeFileSync(userFilePath, userFileContent);

    // Redirect to login page after successful signup
    res.redirect('/login.html');
});


// Start HTTPS server
https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
