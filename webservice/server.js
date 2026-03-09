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


async function canSummarize() {
    if (sinceLastSummary > 100) {
        try {
            const summaryResponse = await fetch("http://flask:8000/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_history: chatHistory }),
            })

            if (!summaryResponse.ok) {
                throw new Error("Flask API not working, check endpoints " + summaryResponse.ok)
            }

            sinceLastSummary = 0;
            const summaryData = await summaryResponse.json();
            latestSummary = summaryData["summary"]
        } catch (error) {
            console.error("Error getting summary: " + error)
        }
    }

    sinceLastSummary = 0;
}













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

let chatHistory = [
  "Hey everyone, how was your weekend?",
  "Pretty good! Went hiking up in the mountains.",
  "Nice! I stayed home and binge-watched some shows.",
  "Which shows did you watch?",
  "Stranger Things and some comedy specials.",
  "I went to a concert! The band was amazing!",
  "Which band?",
  "The indie rock band from Seattle. Forgot the name though.",
  "Haha that happens. Did you get merch?",
  "Yup, got a t-shirt and a poster!",
  "Cool! I wish I went to concerts more often.",
  "Hey, did anyone finish the project draft?",
  "Almost! I just need to write the conclusion.",
  "I can help with that if you want.",
  "That would be great, thanks!",
  "Also, did anyone check the new library updates?",
  "Yes, the new version fixed a lot of bugs.",
  "Awesome! That should make our workflow smoother.",
  "By the way, anyone up for a game night later?",
  "I’m in! What games?",
  "Maybe Codenames or Jackbox?",
  "Jackbox sounds fun, I’m free after 7.",
  "Perfect, let’s do that then.",
  "Cool, I’ll set up the Zoom link.",
  "Also, reminder that the deadline for the report is Friday.",
  "Right, let’s make sure we submit on time.",
  "I’ll finalize the figures today.",
  "And I’ll finish the summary section.",
  "Great! Looks like we’re on track.",
  "Anyone want to grab lunch tomorrow?",
  "I’m down! Maybe sushi?",
  "Sushi works for me.",
  "Perfect, 12:30 at that place downtown?",
  "Sounds good, see you then!",
  "I finally tried that new coffee place, it’s amazing.",
  "Which one? The one near the library?",
  "Yes! They have this caramel latte that’s unreal.",
  "I need to check it out soon.",
  "By the way, has anyone seen the latest episode of that drama series?",
  "Not yet, no spoilers!",
  "Same here, trying to avoid it.",
  "I caught up yesterday, it was intense!",
  "Oh no, now I’m scared to watch.",
  "Haha, you’ll love it, just prepare for twists.",
  "Did you guys finish the online quiz for class?",
  "Yes, it was tricky but manageable.",
  "I’m still stuck on question 4 though.",
  "Want me to explain it quickly?",
  "Yes please, that would help a lot.",
  "Also, remember we have the group meeting at 3 PM.",
  "Right, don’t forget to bring your notes.",
  "I’ll bring the slides.",
  "Thanks! That will make things smoother.",
  "After the meeting, anyone want to do a quick workout?",
  "Sure, I could use some stretching.",
  "Same, maybe 30 minutes?",
  "Sounds perfect.",
  "Oh, I got a package today, it’s the book I ordered.",
  "Which book?",
  "The one on personal finance.",
  "Nice! I’ve heard it’s really good.",
  "Yes, can’t wait to start reading it.",
  "By the way, who’s bringing snacks for game night?",
  "I’ll bring some chips and cookies.",
  "Awesome, I’ll handle drinks.",
  "Perfect combo!",
  "Does anyone have a recommendation for a good movie this weekend?",
  "I heard the new sci-fi thriller is amazing.",
  "Oh, that sounds cool. Who’s going to watch it?",
  "I might go Saturday night.",
  "Count me in too!",
  "We should order pizza for the movie night.",
  "Definitely, I’m craving pepperoni.",
  "Same here, can’t wait!",
  "Also, don’t forget to submit your timesheets today.",
  "Thanks for the reminder!",
  "I almost forgot, appreciate it.",
  "Did anyone try the new cafe downtown?",
  "Yes! Their matcha latte is incredible.",
  "I’ll have to check it out soon.",
  "Also, who’s up for a weekend hike?",
  "I am! Saturday works best for me.",
  "Perfect, let’s plan it out later this week.",
  "I’ve been craving some ice cream, anyone else?",
  "Always, haha.",
  "Let’s do a small ice cream run after lunch.",
  "Sounds like a plan!",
  "Remember to review the notes for the upcoming test.",
  "Will do, thanks for the heads up.",
  "I’ve already started, it’s a lot of material.",
  "Yes, better start early.",
  "Also, anyone interested in joining a coding challenge this week?",
  "Count me in!",
  "Me too, sounds fun.",
  "Great, we can form a small team.",
  "By the way, how’s everyone’s pet doing?",
  "My dog is super energetic today!",
  "Mine is napping as usual.",
  "Haha, typical cats."
];
let sinceLastSummary = 110;
let latestSummary = "You haven't missed anything :)";

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
                sinceLastSummary++;
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