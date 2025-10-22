const fs = require('fs');
const path = require('path');

function readEnvFile() {
    const envFilePath = __dirname + "/.env"

    try {
        const fileContent = fs.readFileSync(envFilePath, 'utf8');
        const envVariables = {};

        fileContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVariables[key.trim()] = value.trim();
            }
        });

        return envVariables;
    } catch (error) {
        console.error(`Error reading the .env file: ${error.message}`);
        return null;
    }
}

module.exports = readEnvFile;