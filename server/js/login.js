const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User.js'); // Importe le modèle User

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

        // Set session
        req.session.userId = user._id;

        res.json({ success: true });
    } catch (err) {
        console.error("Error processing request:", err.message);
        res.status(500).json({ error: "Error processing request." });
    }
});

module.exports = router;