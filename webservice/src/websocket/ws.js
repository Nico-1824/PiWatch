//////////////////////////////////////////////////
//////////////////////////////////////////////////
// WEBSOCKET LOGIC BELOW
//////////////////////////////////////////////////
//////////////////////////////////////////////////
const WebSocket = require('ws');
const { server } = require("../app");
const states = require("../services/states");
const { checkForUpdates } = require("../services/interval");

const ws = new WebSocket.Server({ server });

checkForUpdates();


function broadcast(data, socketToOmit) {
    ws.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== socketToOmit) {
            client.send(data);
        }
    });
}



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
                    "weather": states.weatherData,
                    "temp": states.weatherTemp,
                }));
                socket.send(JSON.stringify({
                    "type": "traffic_update",
                    "traffic_index": states.trafficData
                }));
                socket.send(JSON.stringify({
                    "type": "summary",
                    "summary": states.latestSummary
                }));
                break;

            case "chat_message":
                console.log(`Got a chat message from client: ${data["message"]}`);
                states.chatHistory.push(data["message"]);
                states.chatVolume++;
                broadcast(JSON.stringify(data), socket);
                break;
        }
    });
});



module.exports = { ws, broadcast };