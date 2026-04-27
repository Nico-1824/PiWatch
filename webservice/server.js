// Express websocket server
//////////////////////////// 
const http = require("http");
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// SERVER DECLARATION //////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const PORT = 5500;

// Use 127.0.0.1 when running without Docker, flask when running with Docker
const FLASK_HOST = "flask";

const server = http.createServer((req, res) => {
    try {
        if (req.url === '/favicon.ico') return res.end();

        const filePath = (req.url === '/') ? 'index.html' : req.url;

        const extname = path.extname(filePath);
        let contentType = 'text/html';
        if (extname === '.js') contentType = 'text/javascript';
        else if (extname === '.css') contentType = 'text/css';

        const fullPath = path.join(__dirname, filePath);

        fs.readFile(fullPath, (err, content) => {
            if (err) {
                res.writeHead(404);
                return res.end("404 not found");
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    } catch (error) {
        console.log(error);
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////// MAIN LOGIC BELOW /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
let trafficData = -1;
let weatherData = "Unavailable look outside";
let weatherTemp = "Unavailable put your finger out the window";
let chatVolume = 0;
let latestSummary = "You haven't missed anything :)";
let chatHistory = [];


// checkForUpdates() -> void
// Polls Flask every hour for weather and traffic updates and broadcasts to all clients

async function checkForUpdates() {
    try {
        // get traffic data from flask
        const trafficResponse = await fetch(`http://${FLASK_HOST}:8000/traffic`);
        if (!trafficResponse.ok) throw new Error("Failed to get traffic data");

        const trafficJson = await trafficResponse.json();
        if (trafficJson["traffic_index"] !== trafficData) {
            trafficData = trafficJson["traffic_index"];
            broadcast(JSON.stringify({
                "type": "traffic_update",
                "traffic_index": trafficData
            }), null);
        }

        // get weather data from flask
        const weatherResponse = await fetch(`http://${FLASK_HOST}:8000/weather`);
        if (!weatherResponse.ok) throw new Error("Failed to get weather data");

        const weatherJson = await weatherResponse.json();
        if (weatherJson["weather"] !== weatherData || weatherJson["temp"] !== weatherTemp) {
            weatherData = weatherJson["weather"];
            weatherTemp = weatherJson["temp"];
            broadcast(JSON.stringify({
                "type": "weather_update",
                "weather": weatherData,
                "temp": weatherTemp
            }), null);
        }
    } catch (error) {
        console.error("Error checking for updates: " + error);
    }
}

checkForUpdates();
setInterval(checkForUpdates, 60 * 60 * 1000);


// canSummarize() -> void
// Checks every 30 mins if >100 messages were sent, if so generates a summary via Flask

async function canSummarize() {
    try {
        if (chatVolume > 100) {
            const summaryResponse = await fetch(`http://${FLASK_HOST}:8000/summarize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_history: chatHistory }),
            });

            if (!summaryResponse.ok) {
                throw new Error("Flask API not working, check endpoints " + summaryResponse.ok);
            }

            const summaryData = await summaryResponse.json();
            latestSummary = summaryData["summary"];
            broadcast(JSON.stringify({
                "type": "summary",
                "summary": latestSummary
            }), null);
        }

        chatVolume = 0;
    } catch (error) {
        console.error("Error getting summary: " + error);
    }
}

canSummarize();
setInterval(() => { canSummarize(); }, 30 * 60 * 1000);

// Reset and summarize at end of day
setInterval(() => {
    chatVolume = 101;
    canSummarize();
    chatHistory = [];
}, 24 * 60 * 60 * 1000);


//////////////////////////////////////////////////
//////////////////////////////////////////////////
// WEBSOCKET LOGIC BELOW
//////////////////////////////////////////////////
//////////////////////////////////////////////////

function broadcast(data, socketToOmit) {
    ws.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== socketToOmit) {
            client.send(data);
        }
    });
}

const ws = new WebSocket.Server({ server });

ws.on('connection', (socket, req) => {
    console.log(`New client connected: ${req.socket.remoteAddress}`);

    socket.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data["type"]) {
            case "client_connected":
                console.log(`Message from client: ${data["message"]}`);

                // Send current state to newly connected client
                socket.send(JSON.stringify({
                    "type": "weather_update",
                    "weather": weatherData,
                    "temp": weatherTemp,
                }));
                socket.send(JSON.stringify({
                    "type": "traffic_update",
                    "traffic_index": trafficData
                }));
                socket.send(JSON.stringify({
                    "type": "summary",
                    "summary": latestSummary
                }));
                break;

            case "chat_message":
                console.log(`Got a chat message from client: ${data["message"]}`);
                chatHistory.push(data["message"]);
                chatVolume++;
                broadcast(JSON.stringify(data), socket);
                break;
        }
    });
});


//////////////////////////////////////////////////////
// STARTING THE WEBSOCKET SERVER ON PORT
//////////////////////////////////////////////////////

server.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${server.address().port}`);
});