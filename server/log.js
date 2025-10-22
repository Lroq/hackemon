const fs = require('fs');
const path = require('path');

function logErrorToTempFile(err) {
    const filePath = path.join(__dirname, 'temp.txt');
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ${err.stack || err.message || err}\n\n`;

    fs.appendFile(filePath, errorMessage, (writeErr) => {
        if (writeErr) {
            console.error('Erreur lors de l\'écriture dans temp.txt :', writeErr);
        }
    });
}

module.exports = logErrorToTempFile;
