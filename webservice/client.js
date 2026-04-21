// This will be the client websocket recieving from the server
let wsClient;
let latestSummary = "";

//////////////////////////
// INIT FUNCTION TO START THE WEBSOCKET
//////////////////////////

function init() {

    if(wsClient) {
        wsClient.onerror = wsClient.onopen = wsClient.onclose = null;
        wsClient.close();
    }

    const URL = `ws://${window.location.hostname}:5500`;
    wsClient = new WebSocket(URL);

    wsClient.onopen = () => {
        const response = {
            "type": "client_connected",
            "message": "Client connected successfully",
        }
        wsClient.send(JSON.stringify(response));
    }

    wsClient.onmessage = (messageEvent) => {
        const data = JSON.parse(messageEvent.data);
        console.log("GOT A MESSAGE FROM SERVER")

        switch (data["type"]) {
            case "chat_message":
                displayUserMessage(data["message"]);
                break;
            case "traffic_update":
                updateTraffic(data["traffic_index"]);
                break;
            case "weather_update":
                updateWeather(data["weather"], data["temp"]);
                break;
            case "summary":
                latestSummary = data["summary"];
                break;
            default:
                console.log("Unknown message type: " + data["type"]);
        }
    }

    wsClient.onclose = () => { wsClient = null; }
    wsClient.onerror = (event) => {
        console.error("Websocket error: " + event);
        wsClient = null;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// MAIN LOGIC BELOW FOR CLIENT ///////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

const textForm = document.getElementsByClassName("chat-input");
const chatBox  = document.getElementsByClassName("chat-box");

textForm[0].addEventListener("submit", (event) => {
    event.preventDefault();
    const message = textForm[0].querySelector("input").value;
    if (!message.trim()) return;

    displayMessage(message);

    wsClient.send(JSON.stringify({
        "type": "chat_message",
        "message": message
    }));

    textForm[0].querySelector("input").value = "";
});

// ─── Display incoming message ───────────────────────────────────
function displayUserMessage(message) {
    const chatMessage = document.createElement("div");
    chatMessage.className = "message-away";
    const span = document.createElement("span");
    span.className = "name-away";
    span.textContent = "User";
    chatMessage.appendChild(span);
    const bubble = document.createElement("div");
    bubble.className = "bubble-away";
    bubble.textContent = message;
    chatMessage.appendChild(bubble);
    chatBox[0].appendChild(chatMessage);
    chatBox[0].scrollTop = chatBox[0].scrollHeight;
}

// ─── Display own message ────────────────────────────────────────
function displayMessage(message) {
    const chatMessage = document.createElement("div");
    chatMessage.className = "message";
    const span = document.createElement("span");
    span.className = "name";
    span.textContent = "You";
    chatMessage.appendChild(span);
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = message;
    chatMessage.appendChild(bubble);
    chatBox[0].appendChild(chatMessage);
    chatBox[0].scrollTop = chatBox[0].scrollHeight;
}

// ─── Update traffic card ────────────────────────────────────────
function updateTraffic(trafficIndex) {
    const scrollView = document.getElementsByClassName("scroll-view")[0];

    let trafficLevel, icon;
    switch(trafficIndex) {
        case -1: trafficLevel = "Unavailable"; icon = "—"; break;
        case  0: trafficLevel = "Clear";       icon = "🟢"; break;
        case  1: trafficLevel = "Light";       icon = "🟡"; break;
        case  2: trafficLevel = "Heavy";       icon = "🟠"; break;
        default: trafficLevel = "Stand Still"; icon = "🔴"; break;
    }

    if (document.getElementsByClassName("data-card-traffic").length > 0) {
        document.getElementsByClassName("data-card-traffic")[0].innerHTML =
            `<h2>🚗 Traffic</h2><p>${icon} ${trafficLevel}</p>`;
        return;
    }

    const card = document.createElement("div");
    card.className = "data-card-traffic";
    card.innerHTML = `<h2>🚗 Traffic</h2><p>${icon} ${trafficLevel}</p>`;
    scrollView.appendChild(card);
}

// ─── Update weather card ────────────────────────────────────────
function updateWeather(weather, temp) {
    const scrollView = document.getElementsByClassName("scroll-view")[0];

    const weatherIcons = {
        Clear: "☀️", Clouds: "☁️", Rain: "🌧️",
        Drizzle: "🌦️", Thunderstorm: "⛈️", Snow: "❄️",
        Mist: "🌫️", Fog: "🌫️"
    };
    const icon = weatherIcons[weather] || "🌡️";

    if (document.getElementsByClassName("data-card-weather").length > 0) {
        document.getElementsByClassName("data-card-weather")[0].innerHTML =
            `<h2>🌤 Weather</h2><p>${icon} ${weather}</p><p>🌡 ${temp}°F</p>`;
        return;
    }

    const card = document.createElement("div");
    card.className = "data-card-weather";
    card.innerHTML = `<h2>🌤 Weather</h2><p>${icon} ${weather}</p><p>🌡 ${temp}°F</p>`;
    scrollView.appendChild(card);
}

// ─── Update crime card ──────────────────────────────────────────
function updateCrime(crimeData) {
    const scrollView = document.getElementsByClassName("scroll-view")[0];

    const total = crimeData.total;
    const incidents = crimeData.incidents || {};
    const date = crimeData.date || "Yesterday";

    let itemsHTML = "";
    const sorted = Object.entries(incidents).sort((a, b) => b[1] - a[1]);
    for (const [type, count] of sorted) {
        itemsHTML += `
            <div class="crime-item">
                <span>${type}</span>
                <span class="crime-count">${count}</span>
            </div>`;
    }

    if (!itemsHTML) {
        itemsHTML = `<p style="color:var(--muted);font-size:0.82rem;">No incidents reported</p>`;
    }

    const html = `
        <h2>🚨 Crime — ${date}</h2>
        <div class="crime-total">${total === -1 ? "—" : total} <span style="font-size:0.7rem;color:var(--muted);font-weight:400;">incidents</span></div>
        ${itemsHTML}
    `;

    if (document.getElementsByClassName("data-card-crime").length > 0) {
        document.getElementsByClassName("data-card-crime")[0].innerHTML = html;
        return;
    }

    const card = document.createElement("div");
    card.className = "data-card-crime";
    card.innerHTML = html;
    scrollView.appendChild(card);
}

// ─── Seed a default crime card on load ─────────────────────────
// This shows the mock data from crime.py on startup
window.addEventListener("DOMContentLoaded", () => {
    updateCrime({
        total: 12,
        date: "Yesterday",
        incidents: {
            "Disturbance": 4,
            "Vehicle Theft": 3,
            "Burglary": 2,
            "Suspicious Person": 2,
            "Vandalism": 1
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////
// Modal logic
//////////////////////////////////////////////////////////////////////////////////////
const modal       = document.getElementById('summary-modal');
const summaryText = document.getElementById('summary-text');

document.getElementById('summary-btn').addEventListener('click', () => {
    summaryText.textContent = latestSummary || "No summary available yet.";
    modal.classList.remove('hidden');
});

document.getElementById('modal-close').addEventListener('click', () => {
    modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.add('hidden');
});

init();