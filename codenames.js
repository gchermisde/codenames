const webSocketEndpoint = "wss://vo41xadzr9.execute-api.us-east-1.amazonaws.com/production";

const g_gameState = {
    currentRole: null, // values: "codemaster", "guesser"
    currentColor: null, // values: "red", "blue"
    bluesLeft: 8,
    redsLeft: 9,
    assassinsLeft: 1,
    gameOver: false,
    allowClicks: false,
    clicksDoneThisTurn: 0,
    myPlayerName: null,
    myPlayerRole: null, // values: "codemaster", "guesser"
    myPlayerColor: null, // values: "red", "blue"
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

const hide = function(elem) {
    const x = document.getElementById(elem);
    x.classList.add("hidden");
}


const show = function(elem) {
    const x = document.getElementById(elem);
    x.classList.remove("hidden");
}

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
                if (g_gameState.currentColor === "red") {
                    g_gameState.allowClicks = false;
                }
            }
            if (classList.contains('redteam')) {
                g_gameState.redsLeft = g_gameState.redsLeft - 1;
                if (g_gameState.currentColor === "blue") {
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
            if (g_gameState.bluesLeft === 0){
                hide("doneTurnButton");
                hide("codeDisplay");
                show("blueTeamWon");
                gridElem.classList.add("codemaster");
                const bodyElem = document.getElementById("body");
                bodyElem.classList.add("blueBackground");
            }
            if (g_gameState.redsLeft === 0){
                hide("doneTurnButton");
                hide("codeDisplay");
                show("redTeamWon");
                gridElem.classList.add("codemaster");
                const bodyElem = document.getElementById("body");
                bodyElem.classList.add("redBackground");
            }
            if (g_gameState.assassinsLeft === 0){
                gridElem.classList.add("codemaster");
                hide("codeDisplay");
                hide("doneTurnButton");
                if (g_gameState.currentColor === "red") {
                    show("blueteamWon");
                    const bodyElem = document.getElementById("body");
                    bodyElem.classList.add("blueBackground");
                } else {
                    show("redteamWon");
                    const bodyElem = document.getElementById("body");
                    bodyElem.classList.add("redBackground");
                }
            }
        }
    }
};

const startGame = function() {
    console.log("starting new game");
    hide("waitingRoom");
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
    show("gameRoom");
    g_gameState.bluesLeft = 8;
    g_gameState.redsLeft = 9;
    g_gameState.assassinsLeft = 1;
    g_gameState.currentRole = "codemaster";
    g_gameState.currentColor = "red";
    const bodyElem = document.getElementById("body");
    bodyElem.classList.remove("redBackground");
    bodyElem.classList.remove("blueBackground");
    hide("blueteamWon");
    hide("redteamWon");
    const codeEntryWordElem = document.getElementById("codeEntryWord");
    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
    const whoseTurnRoleElem = document.getElementById("whoseTurnRole");
    codeEntryWordElem.value = "";
    codeEntryNumberElem.value = "";
    whoseTurnRoleElem.innerHTML = "Codemaster";
    const whoseTurnColorElem = document.getElementById("whoseTurnColor");
    whoseTurnColorElem.innerHTML = "Red";
    g_gameState.currentColor = "red";
    hide("codeDisplay");
    show("gameBoard");
    const myColor = document.getElementById("myColor");
    myColor.innerHTML = g_gameState.myPlayerColor;
    const myRole = document.getElementById("myRole");
    myRole.innerHTML = g_gameState.myPlayerRole;

    // --- Set things for THIS player ---
    if (g_gameState.myPlayerRole === "codemaster") {
        const gridElem = document.getElementById("grid");
        gridElem.classList.add("codemaster");
    }
    if (g_gameState.myPlayerColor === "red" && g_gameState.myPlayerRole === "codemaster") {
        show("doneTurnButton");
        show("codeEntry");
    } else {
        hide("codeEntry");
    }
}


function switchTurn(message) {
    const gridElem = document.getElementById("grid");
    const codeEntryWordElem = document.getElementById("codeEntryWord");
    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
    const codeDisplayWordElem = document.getElementById("codeDisplayWord");
    const codeDisplayNumberElem = document.getElementById("codeDisplayNumber");
    const whoseTurnRoleElem = document.getElementById("whoseTurnRole");
    const whoseTurnColorElem = document.getElementById("whoseTurnColor");
    if (g_gameState.currentRole === "codemaster") {
        // from codemaster to guesser
        g_gameState.clicksDoneThisTurn = 0;
        hide("mustEnterMessage");
        hide("codeEntry");
        show("codeDisplay");
        codeDisplayWordElem.innerHTML = message.data.codeEntryWord;
        codeDisplayNumberElem.innerHTML = message.data.codeEntryNumber;
        whoseTurnRoleElem.innerHTML = "Guesser";
        g_gameState.currentRole = "guesser";
        g_gameState.allowClicks = true;
        //does the actual stuff of switching
        hide("gameBoard");
    } else {
        // from guesser to codemaster
        gridElem.classList.add("codemaster");
        show("codeEntry");
        hide("codeDisplay");
        codeEntryWordElem.value = "";
        codeEntryNumberElem.value = "";
        whoseTurnRoleElem.innerHTML = "Codemaster";
        if (g_gameState.currentColor === "red") {
            whoseTurnColorElem.innerHTML = "Blue";
            g_gameState.currentColor = "blue";
        } else {
            whoseTurnColorElem.innerHTML = "Red";
            g_gameState.currentColor = "red";
        }
        g_gameState.currentRole = "codemaster";
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
            show("readyToPlayButton");
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
                } else if (message.data.messageType === "doneCodemasterTurn") {
                    switchTurn(message);
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

        const clickedDoneTurn = function() {
            let jsonMessage;
            if (g_gameState.myPlayerRole === "codemaster") {
                const codeEntryWordElem = document.getElementById("codeEntryWord");
                const codeEntryNumberElem = document.getElementById("codeEntryNumber");
                if (codeEntryWordElem.value === "" || codeEntryNumberElem.value === "") {
                    show("mustEnterMessage");
                    return;
                } else {
                    const codeEntryWordElem = document.getElementById("codeEntryWord");
                    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
                    jsonMessage = {messageType: "doneCodemasterTurn", codeEntryWord: codeEntryWordElem.value, codeEntryNumber: codeEntryNumberElem.value};
                }
            } else {
                jsonMessage = {messageType: "doneGuesserTurn"};
            }
            //sending a message
            const fullMessage = {action: "sendMessage", "data": jsonMessage};
            const messageText = JSON.stringify(fullMessage);
            console.log(`Sending "${messageText}"`);
            g_webSocket.send(messageText);

            switchTurn(fullMessage);
        }
        const doneTurnButtonElem = document.getElementById("doneTurnButton");
        doneTurnButtonElem.onclick = clickedDoneTurn;

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
            hide("joiningRoom");
            show("waitingRoom");
            g_gameState.myPlayerName = playerId;
        }
        joinGameButtonElem.onclick = onJoinGame;
        joinGameButtonElem.disabled = false;
    }

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