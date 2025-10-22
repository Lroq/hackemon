const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const readEnvFile = require('./readfile');
const envVariables = readEnvFile();

const app = express();
const PORT = 3000;

console.log(envVariables);

if (
  envVariables.MONGO_INITDB_ROOT_USERNAME &&
  envVariables.MONGO_INITDB_ROOT_PASSWORD
) {
  const username = envVariables.MONGO_INITDB_ROOT_USERNAME;
  const password = envVariables.MONGO_INITDB_ROOT_PASSWORD;
  const database = 'hackemon';

  //const mongoUri = `mongodb://${username}:${password}@localhost:27017/${database}?authSource=admin`;
  const mongoUri = 'mongodb://localhost:27017/hackemon';
  console.log(mongoUri);
  //useNewUrlParser: true;
  //useUnifiedTopology: true;
  /*
    // Connexion à MongoDB via Mongoose
    mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('Connexion à MongoDB réussie.');
    }).catch(err => {
        console.error('Erreur de connexion à MongoDB:', err.message);
    });
} else {
    console.error('Impossible de lire les variables d\'environnement. Vérifiez le fichier .env.');
}
*/

  // Connexion à MongoDB via Mongoose
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('Connexion à MongoDB réussie.');
    })
    .catch((err) => {
      console.error('Erreur de connexion à MongoDB:', err.message);
    });
}

// Middleware parse requêtes JSON
app.use(express.json());

// Middleware parse requêtes URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware statiques
app.use(express.static(path.join(__dirname, '../')));

app.use('/public', express.static('../public'));

app.use(
  session({
    secret: 'hackemon_lesmeilleurs8',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true pour HTTPS
  })
);

const routes = require('./routes');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
