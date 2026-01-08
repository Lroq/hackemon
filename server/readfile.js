const fs = require("fs");
const path = require("path");

function readEnvFile() {
    const envFilePath = path.join(__dirname, '..','..', '.env'); // pour le déploiement serveur
    //const envFilePath = path.join(__dirname,'.env'); pour le local
    try {
        const fileContent = fs.readFileSync(envFilePath, "utf8");
        const envVariables = {};

        fileContent.split("\n").forEach(line => {
            const [key, ...rest] = line.split("=");
            if (!key || !rest.length) return;
            envVariables[key.trim()] = rest.join("=").trim();
        });

        return envVariables;

    } catch (error) {
        console.error(`Error reading the .env file: ${error.message}`);
        return {};
    }
}

module.exports = readEnvFile;