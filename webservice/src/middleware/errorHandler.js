const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, "../../app.log");

// error handler middleware to catch any errors that occur by logging and printing to stack tree
const errorHandler = async (err, req, res, next) => {
    try {
        const time = new Date().toISOString();
        const errorLog = `[${time}] Error: ${err.message} \n`;
        await fs.promises.appendFile(logFilePath, errorLog);
        console.error(err.stack);
        res.status(500).json({ error: "Internal Server Error" });
    } catch (error) {
        next(error);
    }
}

module.exports = { errorHandler };