const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FOLDER = './users';
const SECRET_KEY = 'your-secret-key';  // Use a strong secret key in production

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

// Rewards page - fetch rewards for the authenticated user
app.get('/rewards', authenticateJWT, async (req, res) => {
    const userFilePath = path.join(USERS_FOLDER, `${req.user.username}.json`);

    if (!fs.existsSync(userFilePath)) {
        return res.status(404).json({ message: 'User data not found' });
    }

    const userData = await fs.readJson(userFilePath);
    res.json({ rewards: userData.rewards });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
