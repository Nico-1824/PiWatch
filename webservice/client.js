// This will be the client websocket recieving from the server
let wsClient;

//////////////////////////
// INIT FUNCTION TO START THE WEBSOCKET
//////////////////////////

function init() {

    // check if the client is open and if so close it
    if(wsClient) {
        wsClient.onerror = wsClient.onopen = wsClient.onclose = null;
        wsClient.close();
    }

    const URL = 'ws://localhost:5500';
    wsClient = new WebSocket(URL);

    wsClient.onopen = () => {
        const response = {
            "type":"client_connected",
            "message":"Client connected successfully",
        }
        wsClient.send(JSON.stringify(response));
    }

    wsClient.onmessage = (messageEvent) => {
        // Recieve info from the server
        const data = JSON.parse(messageEvent.data);
        console.log("GOT A MESSAGE FROM SERVER")

        switch (data["type"]) {
            case "chat_message": // if a message is recieved from the server, display it
                displayUserMessage(data["message"]);
                break;
            case "traffic_update": // if a traffic update is recieved from the server, update it
                updateTraffic(data["traffic_index"]);
                break;
            case "weather_update": // if a weather update is recieved from the server, update it
                updateWeather(data["weather"], data["temp"]);
                break;
            case "chat_history":
                for (let message of data["chat_history"]) {
                    displayUserMessage(message);
                }
            default:
                console.log("Unknown message type" + data["type"]);
        }
    }

    wsClient.onclose = (event) => {
        wsClient = null;
    }

    wsClient.onerror = (event) => {
        console.error("Websocket error: " + event);
        wsClient = null;
    }
}






//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// MAIN LOGIC BELOW FOR CLIENT ///////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////


const textForm = document.getElementsByClassName("chat-input")
const chatBox = document.getElementsByClassName("chat-box");


// Handle the chat form for the shat room
// will recieve messages and send them to the server to be sent to other clients
//

textForm[0].addEventListener("submit", (event) => {
    event.preventDefault();

    const message = textForm[0].querySelector("input").value;

    displayMessage(message);

    const response = {
        "type": "chat_message",
        "message": message
    }
    wsClient.send(JSON.stringify(response));

    textForm[0].querySelector("input").value = "";
})



// displayUserMessage(message) => void
// +message is a string that is recieved by the server from other clients
// will update the chat room and add chat bubbles containing messages from other people

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




// displayMessage(message) => void
// +message is a string that the client is sending to the server
// will update the chat room and add chat bubbles containing the message the client sent

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





// updateTraffic(trafficIndex) => void
// +trafficIndex is a number that is recieved by the server from traffic api and means the traffic level has changed
// will update the traffic info card on all clients with new traffic level

function updateTraffic(trafficIndex) {
    const scrollView = document.getElementsByClassName("scroll-view")[0];
    let trafficLevel = null;
    switch(trafficIndex) {
        case -1:
            trafficLevel = "Unavailable"
            break;
        case 0:
            trafficLevel = "Low";
            break;
        case 1:
            trafficLevel = "Moderate";
            break;
        case 2:
            trafficLevel = "Heavy";
            break;
        default:
            trafficLevel = "Stand Still";
            break;
    }

    if (document.getElementsByClassName("data-card-traffic").length > 0) {
        const trafficCard = document.getElementsByClassName("data-card-traffic")[0];
        trafficCard.innerHTML = `<h2> Traffic </h2><p> Traffic level: ${trafficLevel}</p>`;
        return;
    }

    const trafficCard = document.createElement("div");
    trafficCard.className = "data-card-traffic";
    trafficCard.innerHTML = `<h2> Traffic </h2><p> Traffic level: ${trafficLevel}</p>`;
    scrollView.appendChild(trafficCard);
}







// updateWeather(weather, temp) => void
// +weather is a string that is recieved from the server from the weather api and indicates the weather conditions such as sunny, rainy, etc.
// + temp is a number that indicated the temperature in F that is recieved from the server
// will update the weather info card all all clients with the new information recieved

function updateWeather(weather, temp) {
    const scrollView = document.getElementsByClassName("scroll-view")[0];

    if (document.getElementsByClassName("data-card-traffic").length > 0) {
        const weatherCard = document.getElementsByClassName("data-card-weather")[0];
        weatherCard.innerHTML = `<h2> Weather </h2><p> Weather: ${weather}</p><p> Temp: ${temp}</p>`;
        return;
    }

    const weatherCard = document.createElement("div");
    weatherCard.className = "data-card-weather";
    weatherCard.innerHTML = `<h2> Weather </h2><p> Weather: ${weather}</p><p> Temp: ${temp}</p>`;
    scrollView.appendChild(weatherCard);
}
























init();