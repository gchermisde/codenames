

const listOfAllBoxes = function() {
    const boxes = [];
    for (let i=0; i<25; i++) {
        boxes.push(`word${i+1}`);
    }
    return boxes;
};


const setWord = function(wordId) {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    const elem = document.getElementById(wordId);
    elem.innerHTML = randomWord;
};

const resetAllWords = function() {
    for (const box of listOfAllBoxes()) {
        setWord(box);
    }
};

const pickBox = function(boxes){
    const position = Math.floor(Math.random() * boxes.length);
    const box = boxes[position];
    boxes.splice(position, 1);
    return box;
};



const placeColor = function(neededBoxes,color){
    const box = pickBox(neededBoxes);
    if ( document.getElementById(box).classList.contains('innocent'))
        document.getElementById(box).classList.remove('innocent');
    if ( document.getElementById(box).classList.contains('redteam'))
        document.getElementById(box).classList.remove('redteam');
    if ( document.getElementById(box).classList.contains('blueteam'))
        document.getElementById(box).classList.remove('blueteam');
    if ( document.getElementById(box).classList.contains('assassin'))
        document.getElementById(box).classList.remove('assassin');
    document.getElementById(box).classList.add(color);
};

const colorAllWords = function(){
    const boxes = listOfAllBoxes();
    for (let i=0; i<8; i++) {
        placeColor(boxes, "blueteam");
    }
    for (let i=0; i<9; i++) {
        placeColor(boxes, "redteam");
    }
    for (let i=0; i<1; i++) {
        placeColor(boxes, "assassin");
    }
    for (let i=0; i<7; i++) {
        placeColor(boxes, "innocent");
    }
}

const clickWord = function(gameState, cellId){
    if (gameState.allowClicks === true) {
        const classList = document.getElementById(cellId).classList;
        if (!classList.contains('revealed')){
            gameState.clicksDoneThisTurn = gameState.clicksDoneThisTurn + 1;
            if (classList.contains('blueteam')) {
                gameState.bluesLeft = gameState.bluesLeft - 1;
                if (gameState.currentTeam === "red") {
                    gameState.allowClicks = false;
                }
            }
            if (classList.contains('redteam')) {
                gameState.redsLeft = gameState.redsLeft - 1;
                if (gameState.currentTeam === "blue") {
                    gameState.allowClicks = false;
                }
            }
            if (classList.contains('innocent')) {
                gameState.allowClicks = false;
            }
            if (classList.contains('assassin')) {
                gameState.assassinsLeft = gameState.assassinsLeft - 1;
                gameState.allowClicks = false;
            }
            classList.add("revealed");
            //decide if we've clicked enough times//
            const numberElem = document.getElementById("codeEntryNumber");
            const numberString = numberElem.value;
            const number = parseInt(numberString);
            if (number + 1 <= gameState.clicksDoneThisTurn) {
                gameState.allowClicks = false;
            }
            //is game over check//
            const gridElem = document.getElementById("grid");
            const codeDisplayElem = document.getElementById("codeDisplay");
            const doneTurnButtonElem = document.getElementById("doneTurnButton");
            const redteamWonElem = document.getElementById("redteamWon");
            const blueteamWonElem = document.getElementById("blueteamWon");
            if (gameState.bluesLeft === 0){
                doneTurnButtonElem.classList.add("hidden");
                codeDisplayElem.classList.add("hidden");
                blueteamWonElem.classList.remove("hidden");
                gridElem.classList.add("codemaster");
                const bodyElem = document.getElementById("body");
                bodyElem.classList.add("blueBackground");
            }
            if (gameState.redsLeft === 0){
                doneTurnButtonElem.classList.add("hidden");
                codeDisplayElem.classList.add("hidden");
                const redteamWonElem = document.getElementById("redteamWon");
                redteamWonElem.classList.remove("hidden");
                gridElem.classList.add("codemaster");
                const bodyElem = document.getElementById("body");
                bodyElem.classList.add("redBackground");
            }
            if (gameState.assassinsLeft === 0){
                gridElem.classList.add("codemaster");
                codeDisplayElem.classList.add("hidden");
                doneTurnButtonElem.classList.add("hidden");
                if (gameState.currentTeam === "red") {
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

const startGame = function(gameState){
    resetAllWords();
    colorAllWords();
    for (const box of listOfAllBoxes()) {
        if ( document.getElementById(box).classList.contains('revealed')){
            document.getElementById(box).classList.remove('revealed');
        }
    }
    gameState.bluesLeft = 8;
    gameState.redsLeft = 9;
    gameState.assassinsLeft = 1;
    gameState.showingCodemaster = true;
    gameState.currentTeam = "red";
    const gameBoardElem = document.getElementById("gameBoard");
    gameBoardElem.classList.add("hidden");
    const whoseTurnElem = document.getElementById("whoseTurn");
    whoseTurnElem.classList.remove("hidden");
    const bodyElem = document.getElementById("body");
    bodyElem.classList.add("redBackground");
    bodyElem.classList.remove("blueBackground");
    const gridElem = document.getElementById("grid");
    gridElem.classList.add("codemaster");
    const blueteamWonElem = document.getElementById("blueteamWon");
    blueteamWonElem.classList.add("hidden");
    const redteamWonElem = document.getElementById("redteamWon");
    redteamWonElem.classList.add("hidden");
    const doneTurnButtonElem = document.getElementById("doneTurnButton");
    doneTurnButtonElem.classList.remove("hidden");
    const codeEntryElem = document.getElementById("codeEntry");
    const codeDisplayElem = document.getElementById("codeDisplay");
    const codeEntryWordElem = document.getElementById("codeEntryWord");
    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
    const whoseTurnRoleElem = document.getElementById("whoseTurnRole");
    codeEntryElem.classList.remove("hidden");
    codeDisplayElem.classList.add("hidden");
    codeEntryWordElem.value = "";
    codeEntryNumberElem.value = "";
    whoseTurnRoleElem.innerHTML = "Codemaster";
    const whoseTurnColorElem = document.getElementById("whoseTurnColor");
    whoseTurnColorElem.innerHTML = "Red";
    gameState.currentTeam = "red";

}


function switchTurn(gameState) {
    const gridElem = document.getElementById("grid");
    const codeEntryElem = document.getElementById("codeEntry");
    const codeDisplayElem = document.getElementById("codeDisplay");
    const codeEntryWordElem = document.getElementById("codeEntryWord");
    const codeEntryNumberElem = document.getElementById("codeEntryNumber");
    const codeDisplayWordElem = document.getElementById("codeDisplayWord");
    const codeDisplayNumberElem = document.getElementById("codeDisplayNumber");
    const gameBoardElem = document.getElementById("gameBoard");
    const whoseTurnElem = document.getElementById("whoseTurn");
    const whoseTurnRoleElem = document.getElementById("whoseTurnRole");
    const whoseTurnColorElem = document.getElementById("whoseTurnColor");
    const mustEnterMessageElem = document.getElementById("mustEnterMessage");
    const bodyElem = document.getElementById("body");
    if (gameState.showingCodemaster) {
        // from codemaster to guesser
        gameState.clicksDoneThisTurn = 0;
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
            gameState.showingCodemaster = false;
            gameState.allowClicks = true;
            //does the actual stuf of switching
            gameBoardElem.classList.add("hidden");
            whoseTurnElem.classList.remove("hidden");
            if (gameState.currentTeam === "red") {
                bodyElem.classList.add("redBackground");
            } else {
                bodyElem.classList.add("blueBackground");
            }
        }
    } else {
        // from guesser to codemaster
        gridElem.classList.add("codemaster");
        codeEntryElem.classList.remove("hidden");
        codeDisplayElem.classList.add("hidden");
        codeEntryWordElem.value = "";
        codeEntryNumberElem.value = "";
        whoseTurnRoleElem.innerHTML = "Codemaster";
        if (gameState.currentTeam === "red") {
            whoseTurnColorElem.innerHTML = "Blue";
            gameState.currentTeam = "blue";
        } else {
            whoseTurnColorElem.innerHTML = "Red";
            gameState.currentTeam = "red";
        }
        gameState.showingCodemaster = true;
        gameState.allowClicks = false;
        //does the stuff of swiching
        gameBoardElem.classList.add("hidden");
        whoseTurnElem.classList.remove("hidden");
        if (gameState.currentTeam === "red") {
            bodyElem.classList.add("redBackground");
        } else {
            bodyElem.classList.add("blueBackground");
        }
    }
}

const showGrid = function(){
    const gameBoardElem = document.getElementById("gameBoard");
    gameBoardElem.classList.remove("hidden");
    const whoseTurnElem = document.getElementById("whoseTurn");
    whoseTurnElem.classList.add("hidden");
    const bodyElem = document.getElementById("body");
    bodyElem.classList.remove("redBackground");
    bodyElem.classList.remove("blueBackground");
}

// make whos turn it is, blue of red

//========== do stuff ==========
const gameState = {
    showingCodemaster: true,
    currentTeam: "red",
    bluesLeft: 8,
    redsLeft: 9,
    assassinsLeft: 1,
    gameOver: false,
    allowClicks: false,
    clicksDoneThisTurn: 0,
};

startGame(gameState);
//fix when restart, delete value in entry boxes
// when restart, make it say reds turn
//take out words from list so no repeats
//put on internet so you can play from anywhere :)
/*messages that will be send:
-who is which character
color all words
pick all words*/
