const { broadcast } = require("../websocket/ws");
const states = require("./states");
const FLASK_HOST = "flask";




// checkForUpdates() -> void
// Polls Flask every hour for weather and traffic updates and broadcasts to all clients
async function checkForUpdates() {
    try {
        // get traffic data from flask
        const trafficResponse = await fetch(`http://${FLASK_HOST}:8000/traffic`);
        if (!trafficResponse.ok) throw new Error("Failed to get traffic data");

        const trafficJson = await trafficResponse.json();
        if (trafficJson["traffic_index"] !== states.trafficData) {
            states.trafficData = trafficJson["traffic_index"];
            broadcast(JSON.stringify({
                "type": "traffic_update",
                "traffic_index": states.trafficData
            }), null);
        }

        // get weather data from flask
        const weatherResponse = await fetch(`http://${FLASK_HOST}:8000/weather`);
        if (!weatherResponse.ok) throw new Error("Failed to get weather data");

        const weatherJson = await weatherResponse.json();
        if (weatherJson["weather"] !== states.weatherData || weatherJson["temp"] !== states.weatherTemp) {
            states.weatherData = weatherJson["weather"];
            states.weatherTemp = weatherJson["temp"];
            broadcast(JSON.stringify({
                "type": "weather_update",
                "weather": states.weatherData,
                "temp": states.weatherTemp
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
        if (states.chatVolume > 100) {
            const summaryResponse = await fetch(`http://${FLASK_HOST}:8000/summarize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_history: states.chatHistory }),
            });

            if (!summaryResponse.ok) {
                throw new Error("Flask API not working, check endpoints " + summaryResponse.ok);
            }

            const summaryData = await summaryResponse.json();
            states.latestSummary = summaryData["summary"];
            broadcast(JSON.stringify({
                "type": "summary",
                "summary": states.latestSummary
            }), null);
            states.chatVolume = 0;
        }

    } catch (error) {
        console.error("Error getting summary: " + error);
    }
}

canSummarize();
setInterval(() => { canSummarize(); }, 30 * 60 * 1000);

// Reset and summarize at end of day
setInterval(() => {
    states.chatVolume = 101;
    canSummarize();
    states.chatHistory = [];
}, 24 * 60 * 60 * 1000);


module.exports = { checkForUpdates, canSummarize };