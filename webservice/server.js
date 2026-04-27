const { server } = require("./src/app");
require("./src/websocket/ws");
require("./src/services/states");


// Use 127.0.0.1 when running without Docker, flask when running with Docker
const FLASK_HOST = "flask";


//////////////////////////////////////////////////////
// STARTING THE WEBSOCKET SERVER ON PORT
//////////////////////////////////////////////////////
const PORT = 5500;
server.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${server.address().port}`);
});

module.exports = { FLASK_HOST };