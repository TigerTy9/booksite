const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

// Helper function to generate a unique token
const generateToken = () => crypto.randomBytes(16).toString('hex');

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
        const token = generateToken();
        req.session.token = token;
        // Store the token in the user's file for future reference (you can also store it in a more secure place, like a DB)
        user.token = token;
        fs.writeFileSync(userFilePath, JSON.stringify(user, null, 2));

        res.redirect('/challenges.html');  // Redirect to challenges page after login
    } else {
        res.send('Incorrect password');
    }
});

// Ensure the 'users' directory exists
const ensureUsersDirectory = () => {
    const usersDir = path.join(__dirname, 'users');
    if (!fs.existsSync(usersDir)) {
        fs.mkdirSync(usersDir, { recursive: true });
    }
};

// Sign Up Route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Ensure the users directory exists
    ensureUsersDirectory();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
        username,
        password: hashedPassword,
        challengesCompleted: [] // Track completed challenges
    };

    // Save the user to a JSON file
    const userFilePath = getUserFilePath(username);
    fs.writeFileSync(userFilePath, JSON.stringify(user));

    res.redirect('/login.html');
});

// Challenge Route - Users can submit answers to challenges
app.post('/submit-challenge', (req, res) => {
    const { challengeId, answer } = req.body;

    // Ensure users directory exists
    ensureUsersDirectory();

    // Retrieve the user based on the token
    const token = req.session.token;

    if (!token) {
        return res.send('Not logged in');
    }

    // Find the user with the matching token
    const usersDir = path.join(__dirname, 'users');
    const userFiles = fs.readdirSync(usersDir);
    let user = null;

    for (const file of userFiles) {
        const userFilePath = path.join(usersDir, file);
        const data = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

        if (data.token === token) {
            user = data;
            break;
        }
    }

    if (!user) {
        return res.send('User not found or token expired');
    }

    // Simulate checking the challenge answer (replace with actual logic)
    console.log(`Checking answer for challenge ${challengeId} submitted by ${user.username}`);
    if (answer === 'correct-answer') {
        // Mark the challenge as completed
        user.challengesCompleted.push(challengeId);
        fs.writeFileSync(getUserFilePath(user.username), JSON.stringify(user, null, 2)); // Pretty print with indentation

        console.log(`Challenge ${challengeId} completed by ${user.username}`);
        res.redirect('/rewards.html');  // Redirect to rewards page after completing a challenge
    } else {
        console.log('Incorrect answer for challenge:', challengeId);
        res.send('Incorrect answer, please try again.');
    }
});

// Rewards Page - Display unlocked rewards
app.get('/rewards', (req, res) => {
    if (!req.session.token) {
        return res.redirect('/login.html');  // Redirect to login if not logged in
    }

    const token = req.session.token;

    // Retrieve the user based on the token
    const usersDir = path.join(__dirname, 'users');
    const userFiles = fs.readdirSync(usersDir);
    let user = null;

    for (const file of userFiles) {
        const userFilePath = path.join(usersDir, file);
        const data = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

        if (data.token === token) {
            user = data;
            break;
        }
    }

    if (!user) {
        return res.send('User not found or token expired');
    }

    // Simulate rewards based on completed challenges (replace with actual logic)
    const rewards = [
        { id: 'reward1', description: 'Reward 1 unlocked for completing Challenge 1.' },
        { id: 'reward2', description: 'Reward 2 unlocked for completing Challenge 2.' },
        { id: 'reward3', description: 'Reward 3 unlocked for completing Challenge 3.' }
    ];

    let unlockedRewards = rewards.filter(reward => user.challengesCompleted.includes(reward.id));

    if (unlockedRewards.length === 0) {
        unlockedRewards = [{ description: 'No rewards unlocked yet. Complete challenges to unlock rewards!' }];
    }

    let rewardsHTML = unlockedRewards.map(reward => `<li>${reward.description}</li>`).join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Rewards</title>
        </head>
        <body>
            <h1>Congratulations, ${user.username}!</h1>
            <h2>Your Unlocked Rewards:</h2>
            <ul>
                ${rewardsHTML}
            </ul>
            <a href="/challenges.html">Back to Challenges</a><br>
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
