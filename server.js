const express = require('express');
const https = require('https');
const fs = require('fs-extra');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FOLDER = './users';
const SECRET_KEY = 'your-secret-key';  // Use a strong secret key in production

// Load SSL certificate and private key for HTTPS
const privateKey = fs.readFileSync('certs/private.key.pem', 'utf8');
const certificate = fs.readFileSync('certs/domain.cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

app.use(bodyParser.json());
app.use(express.static('docs'));  // Serve static files like HTML, CSS, and JS

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Access denied' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Verify login session
app.get("/api/auth/verify", authenticateJWT, (req, res) => {
    res.json({ message: "Authenticated" });
});

// Mark challenge as completed
app.post("/api/challenges/complete", authenticateJWT, async (req, res) => {
    const { chapter } = req.body;
    const userFile = `users/${req.user.username}.json`;

    try {
        const userData = await fs.readJson(userFile);
        userData.completedChallenges = userData.completedChallenges || [];
        if (!userData.completedChallenges.includes(chapter)) {
            userData.completedChallenges.push(chapter);
            await fs.writeJson(userFile, userData, { spaces: 2 });
        }
        res.json({ message: "Challenge completed" });
    } catch (error) {
        res.status(500).json({ message: "Error saving progress" });
    }
});

app.get("/api/rewards/list", authenticateJWT, async (req, res) => {
    const userFile = `users/${req.user.username}.json`;

    try {
        const userData = await fs.readJson(userFile);
        res.json({ unlockedRewards: userData.completedChallenges || [] });
    } catch (error) {
        res.status(500).json({ message: "Error fetching rewards" });
    }
});

app.post("/api/rewards/check", authenticateJWT, async (req, res) => {
    const { rewardId } = req.body;
    const userFile = `users/${req.user.username}.json`;

    try {
        const userData = await fs.readJson(userFile);
        const isUnlocked = userData.completedChallenges?.includes(rewardId);
        res.json({ unlocked: !!isUnlocked });
    } catch (error) {
        res.status(500).json({ message: "Error verifying reward access" });
    }
});

app.get("/api/challenges/list", authenticateJWT, async (req, res) => {
    const userFile = `users/${req.user.username}.json`;

    try {
        const userData = await fs.readJson(userFile);
        res.json({ completedChallenges: userData.completedChallenges || [] });
    } catch (error) {
        res.status(500).json({ message: "Error fetching challenges" });
    }
});

// Register a new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const userFilePath = path.join(USERS_FOLDER, `${username}.json`);
    if (fs.existsSync(userFilePath)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { username, password: hashedPassword, rewards: [] };
    await fs.writeJson(userFilePath, userData);
    res.status(201).json({ message: 'User registered successfully' });
});

// Login a user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userFilePath = path.join(USERS_FOLDER, `${username}.json`);

    if (!fs.existsSync(userFilePath)) {
        return res.status(400).json({ message: 'User not found' });
    }

    const userData = await fs.readJson(userFilePath);
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ username: userData.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Backend route to fetch rewards
app.get('/rewards', authenticateJWT, async (req, res) => {
    const userFilePath = path.join(USERS_FOLDER, `${req.user.username}.json`);

    if (!fs.existsSync(userFilePath)) {
        return res.status(404).json({ message: 'User data not found' });
    }

    const userData = await fs.readJson(userFilePath);
    res.json({ rewards: userData.rewards });
});

// Start the server with HTTPS
https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
