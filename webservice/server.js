// Express websocket server
//////////////////////////// 
const http = require("http");
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// SERVER DECLARATION //////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const PORT  = 5500;
const server = http.createServer((req, res) => {
    try {
        if (req.url === '/favicon.ico') return res.end();

        const filePath = ( req.url === '/') ? 'index.html' : req.url;

        const extname = path.extname(filePath);
        let contentType = 'text/html';
        if (extname === '.js') contentType = 'text/javascript';
        else if (extname === '.css') contentType = 'text/css';

        // pipe the proper file to the res object
        const fullPath = path.join(__dirname, filePath);

        fs.readFile(fullPath, (err, content) => {
            if(err) {
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



// checkForUpdates() -> void
// This function will check for updates from the flask server and if there are any then we send them out to clients


async function checkForUpdates() {

    try {
        // get traffic data from flask
        const trafficResponse = await fetch('http://flask:8000/traffic');
        if(!trafficResponse.ok) {
            throw new Error("Failed to get traffic data");
        }
        const trafficJson = await trafficResponse.json();
        if(trafficJson["traffic_index"] !== trafficData) {
            trafficData = trafficJson["traffic_index"];
            const message = {
                "type": "traffic_update",
                "traffic_index": trafficData
            }
            broadcast(JSON.stringify(message), null);
        }

        // get weather data from flask
        const weatherResponse = await fetch("http://flask:8000/weather");
        if(!weatherResponse.ok) {
            throw new Error("Failed to get weather data");
        }
        const weatherJson = await weatherResponse.json();
        if(weatherJson["weather"] !== weatherData || weatherJson["temp"] !== weatherTemp) {
            weatherData = weatherJson["weather"];
            weatherTemp = weatherJson["temp"];
            const message = {
                "type": "weather_update",
                "weather": weatherData,
                "temp": weatherTemp
            }
            broadcast(JSON.stringify(message), null);
        }
    } catch (error) {
        console.error("Error checking for updates: " + error);
    }
}

checkForUpdates();
setInterval(checkForUpdates, 60 * 60 * 1000);













//////////////////////////////////////////////////
//////////////////////////////////////////////////
// WEBSOCKET LOGIC BELOW
//////////////////////////////////////////////////
//////////////////////////////////////////////////



//////////////////////////////////////////////////
//BROADCAST FUNCTION
//////////////////////////////////////////////////
function broadcast(data, socketToOmit) {
    ws.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== socketToOmit) {
            client.send(JSON.stringify(data));
        }
    })
}

//////////////////////////////////////////////////
// WEBSOCKER SERVER DECLARATION
//////////////////////////////////////////////////
const ws = new WebSocket.Server({ server });

let chatHistory = [];

ws.on('connection', (socket, req) => {
    console.log(`New client connected: ${req.socket.remoteAddress}`);

    socket.on('message', (message) => {
        data = JSON.parse(message);
        
        // check what kind of message it is and see if we need to broadcast
        switch(data["type"]) {
            case "client_connected":
                console.log(`Message from client: ${data["message"]}`);
                const weatherMessage = {
                    "type": "weather_update",
                    "weather": weatherData,
                    "temp": weatherTemp,
                }
                socket.send(JSON.stringify(weatherMessage));
                const trafficMessage = {
                    "type": "traffic_update",
                    "traffic_index": trafficData
                }
                socket.send(JSON.stringify(trafficMessage));
                const chatHistoryMessages = {
                    "type": "chat_history",
                    "chat_history": chatHistory
                }
                socket.send(JSON.stringify(chatHistoryMessages));
                break;
            case "chat_message":
                console.log(`Got a chat message from client: ${data["message"]}`)
                chatHistory.push(data["message"]);
                broadcast(data, socket);
                break;
        }
    })
})







//////////////////////////////////////////////////////
// STARTING THE WEBSOCKET SERVER ON PORT
//////////////////////////////////////////////////////

server.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${server.address().port}`)
})