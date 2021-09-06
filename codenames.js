const webSocketEndpoint = "wss://vo41xadzr9.execute-api.us-east-1.amazonaws.com/production";

const g_gameState = {
    showingCodemaster: true,
    currentTeam: "red",
    bluesLeft: 8,
    redsLeft: 9,
    assassinsLeft: 1,
    gameOver: false,
    allowClicks: false,
    clicksDoneThisTurn: 0,
    myPlayerName: null,
    myPlayerColor: null, // values: "red", "blue"
    myPlayerRole: null, // values: "codemaster", "guesser"
};

const g_setupState = {
    currentRoom: "joiningRoom", // the allowed values are "joiningRoom", "waitingRoom", "gameRoom".
};

let g_webSocket = null;

/* Returns the content of the input element with the given id. */
function getInput(id) {
    const elem = document.getElementById(id);
    return elem.value;
}

const listOfAllBoxes = function() {
    const boxes = [];
    for (let i=0; i<25; i++) {
        boxes.push(`word${i+1}`);
    }
    return boxes;
};

const chooseRandomWords = function() {
    const words = [];
    for (const box of listOfAllBoxes()) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        words.push(randomWord);
    }
    return words;
}

const setWord = function(wordId, word) {
    const elem = document.getElementById(wordId);
    elem.innerHTML = word;
};

const resetAllWords = function(words) {
    const boxes = listOfAllBoxes();
    words.forEach(function(word, i) {
        setWord(boxes[i], word);
    });
};


const removeColor = function(box) {
    if (document.getElementById(box).classList.contains('innocent'))
        document.getElementById(box).classList.remove('innocent');
    if (document.getElementById(box).classList.contains('redteam'))
        document.getElementById(box).classList.remove('redteam');
    if (document.getElementById(box).classList.contains('blueteam'))
        document.getElementById(box).classList.remove('blueteam');
    if (document.getElementById(box).classList.contains('assassin'))
        document.getElementById(box).classList.remove('assassin');
};

const placeColor = function(box, color) {
    removeColor(box);
    document.getElementById(box).classList.add(color);
};


const shuffle = function(array) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        const x = array[currentIndex];
        const y = array[randomIndex];
        array[randomIndex] = x;
        array[currentIndex] = y;
    }

    return array;
}

/*
 * This takes in a list of colors (from chooseColors()) and it fills those
 * colors into the grid. It doesn't return anything.
 */
const placeColors = function(colorList) {
    const boxes = listOfAllBoxes();
    colorList.forEach(function(color, i) {
        placeColor(boxes[i], color);
    });
};

/*
 * This returns a list of 25 color classes (in order) like ["blueteam", "innocent", "blueteam"...].
 */
const chooseColors = function() {
    const colorList = ["blueteam", "blueteam", "blueteam", "blueteam", "blueteam", "blueteam", "blueteam", "blueteam", "redteam", "redteam", "redteam", "redteam", "redteam", "redteam", "redteam", "redteam", "redteam", "assassin", "innocent", "innocent", "innocent", "innocent", "innocent", "innocent", "innocent"];
    shuffle(colorList);
    return colorList;
};


const clickWord = function(cellId){
    if (g_gameState.allowClicks === true) {
        const classList = document.getElementById(cellId).classList;
        if (!classList.contains('revealed')){
            g_gameState.clicksDoneThisTurn = g_gameState.clicksDoneThisTurn + 1;
            if (classList.contains('blueteam')) {
                g_gameState.bluesLeft = g_gameState.bluesLeft - 1;
                if (g_gameState.currentTeam === "red") {
                    g_gameState.allowClicks = false;
                }
            }
            if (classList.contains('redteam')) {
                g_gameState.redsLeft = g_gameState.redsLeft - 1;
                if (g_gameState.currentTeam === "blue") {
                    g_gameState.allowClicks = false;
                }
            }
            if (classList.contains('innocent')) {
                g_gameState.allowClicks = false;
            }
            if (classList.contains('assassin')) {
                g_gameState.assassinsLeft = g_gameState.assassinsLeft - 1;
                g_gameState.allowClicks = false;
            }
            classList.add("revealed");
            //decide if we've clicked enough times//
            const numberElem = document.getElementById("codeEntryNumber");
            const numberString = numberElem.value;
            const number = parseInt(numberString);
            if (number + 1 <= g_gameState.clicksDoneThisTurn) {
                g_gameState.allowClicks = false;
            }
            //is game over check//
            const gridElem = document.getElementById("grid");
            const codeDisplayElem = document.getElementById("codeDisplay");
            const doneTurnButtonElem = document.getElementById("doneTurnButton");
            const redteamWonElem = document.getElementById("redteamWon");
            const blueteamWonElem = document.getElementById("blueteamWon");
            if (g_gameState.bluesLeft === 0){
                doneTurnButtonElem.classList.add("hidden");
                codeDisplayElem.classList.add("hidden");
                blueteamWonElem.classList.remove("hidden");
                gridElem.classList.add("codemaster");
                const bodyElem = document.getElementById("body");
                bodyElem.classList.add("blueBackground");
            }
            if (g_gameState.redsLeft === 0){
                doneTurnButtonElem.classList.add("hidden");
                codeDisplayElem.classList.add("hidden");
                const redteamWonElem = document.getElementById("redteamWon");
                redteamWonElem.classList.remove("hidden");
                gridElem.classList.add("codemaster");
                const bodyElem = document.getElementById("body");
                bodyElem.classList.add("redBackground");
            }
            if (g_gameState.assassinsLeft === 0){
                gridElem.classList.add("codemaster");
                codeDisplayElem.classList.add("hidden");
                doneTurnButtonElem.classList.add("hidden");
                if (g_gameState.currentTeam === "red") {
                    blueteamWonElem.classList.remove("hidden");
                    const bodyElem = document.getElementById("body");
                    bodyElem.classList.add("blueBackground");
                } else {
                    redteamWonElem.classList.remove("hidden");
                    const bodyElem = document.getElementById("body");
                    bodyElem.classList.add("redBackground");
                }
            }
        }
    }
};

const startGame = function() {
    console.log("starting new game");
    const waitingRoomElem = document.getElementById("waitingRoom");
    waitingRoomElem.classList.add("hidden");
    const iAmPlayer = function(x) {
        return g_gameState.myPlayerName === playerList[x];
    };
    g_gameState.myPlayerColor = iAmPlayer(0) || iAmPlayer(2) ? "red" : "blue";
    g_gameState.myPlayerRole = iAmPlayer(0) || iAmPlayer(1) ? "codemaster" : "guesser";
    if (g_gameState.myPlayerColor === "red" && g_gameState.myPlayerRole === "codemaster") {
        console.log("I'm the red codemaster");
        const words = chooseRandomWords();
        const colorList = chooseColors();
        //sending the message
        const jsonMessage = {messageType: "chooseWordsAndColors", words: words, colorList: colorList};
        const fullMessage = {action: "sendMessage", data: jsonMessage};
        const messageText = JSON.stringify(fullMessage);
        console.log(`Sending "${messageText}"`);
        g_webSocket.send(messageText);

        startPlay(words, colorList);
    }
}


const startPlay = function(words, colorList) {
    // --- Set things for ALL players ---
    resetAllWords(words);
    placeColors(colorList);
    for (const box of listOfAllBoxes()) {
        if ( document.getElementById(box).classList.contains('revealed')){
            document.getElementById(box).classList.remove('revealed');
        }
    }
    const gameRoomElem = document.getElementById("gameRoom");
    gameRoomElem.classList.remove("hidden");
    g_gameState.bluesLeft = 8;
    g_gameState.redsLeft = 9;
    g_gameState.assassinsLeft = 1;
    g_gameState.showingCodemaster = true;
    g_gameState.currentTeam = "red";
    const bodyElem = document.getElementById("body");
    bodyElem.classList.remove("redBackground");
    bodyElem.classList.remove("blueBackground");
    const blueteamWonElem = document.getElementById("blueteamWon");
    blueteamWonElem.classList.add("hidden");
    const redteamWonElem = document.getElementById("redteamWon");
    redteamWonElem.classList.add("hidden");
    const codeEntryWordElem = document.getElementById("codeEntryWord");
    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
    const whoseTurnRoleElem = document.getElementById("whoseTurnRole");
    codeEntryWordElem.value = "";
    codeEntryNumberElem.value = "";
    whoseTurnRoleElem.innerHTML = "Codemaster";
    const whoseTurnColorElem = document.getElementById("whoseTurnColor");
    whoseTurnColorElem.innerHTML = "Red";
    g_gameState.currentTeam = "red";
    const codeDisplayElem = document.getElementById("codeDisplay");
    codeDisplayElem.classList.add("hidden");
    const gameBoardElem = document.getElementById("gameBoard");
    gameBoardElem.classList.remove("hidden");

    // --- Set things for THIS player ---
    if (g_gameState.myPlayerRole === "codemaster") {
        const gridElem = document.getElementById("grid");
        gridElem.classList.add("codemaster");
    } else {
        const codeEntryElem = document.getElementById("codeEntry");
        codeEntryElem.classList.add("hidden");
    }
    if (g_gameState.myPlayerColor === "red" && g_gameState.myPlayerRole === "codemaster") {
        const doneTurnButtonElem = document.getElementById("doneTurnButton");
        doneTurnButtonElem.classList.remove("hidden");
    }
}


function switchTurn() {
    const gridElem = document.getElementById("grid");
    const codeEntryElem = document.getElementById("codeEntry");
    const codeDisplayElem = document.getElementById("codeDisplay");
    const codeEntryWordElem = document.getElementById("codeEntryWord");
    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
    const codeDisplayWordElem = document.getElementById("codeDisplayWord");
    const codeDisplayNumberElem = document.getElementById("codeDisplayNumber");
    const gameBoardElem = document.getElementById("gameBoard");
    const whoseTurnRoleElem = document.getElementById("whoseTurnRole");
    const whoseTurnColorElem = document.getElementById("whoseTurnColor");
    const mustEnterMessageElem = document.getElementById("mustEnterMessage");
    const bodyElem = document.getElementById("body");
    if (g_gameState.showingCodemaster) {
        // from codemaster to guesser
        g_gameState.clicksDoneThisTurn = 0;
        if (
            (codeEntryWordElem !== null && codeEntryWordElem.value === "")||
            (codeEntryNumberElem !== null && codeEntryNumberElem.value === "")
        ) {
            mustEnterMessageElem.classList.remove("hidden");
        } else {
            gridElem.classList.remove("codemaster");
            mustEnterMessageElem.classList.add("hidden");
            codeEntryElem.classList.add("hidden");
            codeDisplayElem.classList.remove("hidden");
            codeDisplayWordElem.innerHTML = codeEntryWordElem.value;
            codeDisplayNumberElem.innerHTML = codeEntryNumberElem.value;
            whoseTurnRoleElem.innerHTML = "Guesser";
            g_gameState.showingCodemaster = false;
            g_gameState.allowClicks = true;
            //does the actual stuff of switching
            gameBoardElem.classList.add("hidden");
        }
    } else {
        // from guesser to codemaster
        gridElem.classList.add("codemaster");
        codeEntryElem.classList.remove("hidden");
        codeDisplayElem.classList.add("hidden");
        codeEntryWordElem.value = "";
        codeEntryNumberElem.value = "";
        whoseTurnRoleElem.innerHTML = "Codemaster";
        if (g_gameState.currentTeam === "red") {
            whoseTurnColorElem.innerHTML = "Blue";
            g_gameState.currentTeam = "blue";
        } else {
            whoseTurnColorElem.innerHTML = "Red";
            g_gameState.currentTeam = "red";
        }
        g_gameState.showingCodemaster = true;
        g_gameState.allowClicks = false;
    }
}


const onPlayerAdded = function(message) {
    //add new line in player list here
    let playerCounter = 0;
    for (const player of message.players) {
        const elem = document.getElementById(`player${playerCounter + 1}`);
        elem.innerText = player;
        playerCounter = playerCounter + 1;
        if (playerCounter === 4) {
            const readyToPlayButtonElem = document.getElementById("readyToPlayButton");
            readyToPlayButtonElem.classList.remove("hidden");
        }
    }
    playerList = message.players;
}

let playerList;

const playerId = function(playerName) {
    const result = playerList.indexOf(playerName);
    if (result === -1) {
        throw Error(`Invalid player name "${playerName}"`);
    }
    return result;
}


const whoIsReadyToPlay = [false, false, false, false];
const onReadyToPlay = function(message) {
    areWeReadyToPlay(message.sender);
}

const areWeReadyToPlay = function(playerName) {
    whoIsReadyToPlay[playerId(playerName)] = true;
    if ( whoIsReadyToPlay.every(x => x) ) {
        console.log("Every one is true");
        g_setupState.currentRoom = "gameRoom";
        startGame();
    }
}


const onChooseWordsAndColors = function(message) {
    const words = message.data.words;
    const colorList = message.data.colorList;
    startPlay(words, colorList);
}


window.addEventListener("load", function() {
    const onGetMessage = function(event) {
        const message = JSON.parse(event.data);
        console.log("received", message);
        if (g_setupState.currentRoom === "joiningRoom") {

        } else if (g_setupState.currentRoom === "waitingRoom") {
            if (message.trigger === "playerAdded") {
                onPlayerAdded(message);
            } else if (message.trigger === "messageSent") {
                if (message.data.messageType === "readyToPlay") {
                    onReadyToPlay(message);
                }
            }
        } else if (g_setupState.currentRoom === "gameRoom") {
            if (message.trigger === "messageSent") {
                if (message.data.messageType === "chooseWordsAndColors") {
                    onChooseWordsAndColors(message);
                }
            }
        }
    };


    function connect() {
        const joinGameButtonElem = document.getElementById("joinGameButton");
        joinGameButtonElem.disabled = true;

        //section that creates websocket
        g_webSocket = new WebSocket(webSocketEndpoint);
        g_webSocket.onmessage = onGetMessage;

        const readyToPlayButtonElem = document.getElementById("readyToPlayButton");
        const clickedReadyToPlay = function() {
            readyToPlayButtonElem.disabled = true;
            readyToPlayButtonElem.innerText = 'Waiting...';
            //sending the message
            const jsonMessage = {messageType: "readyToPlay"};
            const fullMessage = {action: "sendMessage", "data": jsonMessage};
            const messageText = JSON.stringify(fullMessage);
            console.log(`Sending "${messageText}"`);
            g_webSocket.send(messageText);

            areWeReadyToPlay(g_gameState.myPlayerName);
        }
        readyToPlayButtonElem.onclick = clickedReadyToPlay;


        function onJoinGame() {
            const gameId = "codenames-"+getInput("enterJoinGameCode");
            const playerId = getInput("enterUsername");
            const action = "joinGame";
            const message = {action, gameId, playerId};
            const messageText = JSON.stringify(message);
            console.log(`Sending "${messageText}"`);
            g_webSocket.send(messageText);
            g_setupState.currentRoom = "waitingRoom";
            console.log("you are in the waiting room");
            const joiningRoomElem = document.getElementById("joiningRoom");
            joiningRoomElem.classList.add("hidden");
            const waitingRoomElem = document.getElementById("waitingRoom");
            waitingRoomElem.classList.remove("hidden");
            g_gameState.myPlayerName = playerId;
        }
        joinGameButtonElem.onclick = onJoinGame;
        joinGameButtonElem.disabled = false;
    };

    // make whos turn it is, blue of red

    //========== do stuff ==========

    connect();

});


//fix when restart, delete value in entry boxes
// when restart, make it say reds turn
//take out words from list so no repeats
//put on internet so you can play from anywhere :)
/*messages that will be send:
-who is which character
color all words
pick all words*/
// BUG Uncaught DOMException: An attempt was made to use an object that is not, or is no longer, usable, line 299