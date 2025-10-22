// routes.js
const express = require('express');
const path = require('path');
const User = require('./models/User');

const router = express.Router();

const registerRouter = require('./js/register');
router.use('/register', registerRouter);

const loginRouter = require('./js/login');
router.use('/login', loginRouter);

router.get("/profile", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Veuillez vous connecter." });
    }

    User.findById(req.session.userId, (err, user) => {
        if (err) {
            console.error("Erreur lors de la récupération de l'utilisateur:", err.message);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        res.json(user);
    });
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/index.html'));
});

module.exports = router;
