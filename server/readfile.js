const fs = require('fs');
const path = require('path');

function readEnvFile() {
    const envFilePath = path.join(process.cwd(), ".env");

    try {
        const fileContent = fs.readFileSync(envFilePath, 'utf8');
        const envVariables = {};

        fileContent.split('\n').forEach(line => {
            line = line.trim();

            if (!line || line.startsWith('#')) return;

            const index = line.indexOf('=');
            if (index === -1) return;

            const key = line.slice(0, index).trim();
            const value = line.slice(index + 1).trim();

            envVariables[key] = value;
        });

        return envVariables;

    } catch (error) {
        console.error(`Error reading the .env file: ${error.message}`);
        return {};
    }
}

module.exports = readEnvFile;