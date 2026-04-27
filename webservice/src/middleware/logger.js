const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, "../../app.log");

//check if there is a log file, if not create one
if(!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "Server started at " + new Date().toISOString() + "\n");
}

// What do we want to log:
// - all incoming requests (url, timestamp)
// - outgoing messages to clients (message content, timestamp, and response status)
// - any errors that occur

// logRequest(req, res, next) will be used as middleware to log incoming and outgoing requests
const logRequest = async (req, res, next) => {
    try {
        const time = new Date().toISOString();
        const incomingLogEntry = `[${time}] ${req.method} ${req.url}\n`;
        await fs.promises.appendFile(logFilePath, incomingLogEntry);
        res.on('finish', () => {
            const time = new Date().toISOString();
            const outgoingLogEntry = `[${time}] ${req.method} ${res.statusCode} \n`;
            fs.appendFile(logFilePath, outgoingLogEntry);
        })
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { logRequest };