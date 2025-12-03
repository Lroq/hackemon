const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Importe le modèle User

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const router = express.Router();

// Login route
router.post("/", async (req, res) => {
    console.log("Login data received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        // Check if the user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Email or password is incorrect." });
        }

        // Verify the password
        const match = await bcrypt.compare(password, user.hashpassword);
        if (!match) {
            return res.status(400).json({ error: "Email or password is incorrect." });
        }

        const tokenPayload = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({ success: true, token, user: tokenPayload });
    } catch (err) {
        console.error("Error processing request:", err.message);
        res.status(500).json({ error: "Error processing request." });
    }
});

module.exports = router;