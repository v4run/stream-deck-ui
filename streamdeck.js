const StreamDeck = require("elgato-stream-deck");
const fs = require('fs');

let myStreamDeck;

try {
    myStreamDeck = new StreamDeck();
} catch (err) {
    console.error(err);
}

module.exports = {
    device: myStreamDeck
};
