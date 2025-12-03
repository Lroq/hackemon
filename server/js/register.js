const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User.js"); // Importe le modèle User

const router = express.Router();

//Route d'inscription
router.post("/", async (req, res) => {
  console.log("Données d'inscription reçues :", req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Un utilisateur avec cet email existe déjà." });
    }

    // Validation du mot de passe
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{12,}/;
    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .json({
          error:
            "Le mot de passe doit contenir au moins 12 caractères, un chiffre, une lettre majuscule, une lettre minuscule et un caractère spécial.",
        });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    console.log("Création d'un nouvel utilisateur avec les données :", {
      username,
      email,
      hashedPassword,
    });

    const newUser = new User({
      username,
      email,
      hashpassword: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "Inscription réussie." });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;
