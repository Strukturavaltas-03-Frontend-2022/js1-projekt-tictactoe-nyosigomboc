'use strict'

/*

Stephen Falken: The whole point was to find a way to practice nuclear war without destroying ourselves.
    To get the computers to learn from mistakes we couldn't afford to make. Except, I never could get Joshua to learn the most important lesson.
David Lightman: What's that?
Stephen Falken: Futility. That there's a time when you should just give up.
Jennifer: What kind of a lesson is that?
Stephen Falken: Did you ever play tic-tac-toe?
Jennifer: Yeah, of course.
Stephen Falken: But you don't anymore.
Jennifer: No.
Stephen Falken: Why?
Jennifer: Because it's a boring game. It's always a tie.
Stephen Falken: Exactly. There's no way to win. The game itself is pointless!
    But back at the war room, they believe you can win a nuclear war. That there can be "acceptable losses."



Joshua: Greetings, Professor Falken.
Stephen Falken: Hello, Joshua.
Joshua: A strange game. The only winning move is not to play. How about a nice game of chess?

-Wargames (1983), http://www.imdb.com/title/tt0086567/trivia?tab=qt&ref_=tt_trv_qu

see also: https://www.youtube.com/watch?v=A45p48rDlwQ

Nyos

*/

// a list of URLs to redirect the user when ZERO players got selected
const URLs = 
[
    'https://www.youtube.com/watch_popup?v=KXzNo0vR_dU', // 3rd clip, Shall We Play a Game?
    'https://www.youtube.com/watch_popup?v=1vmnp7ghGPk', // 5th clip, Futility
    'https://www.youtube.com/watch_popup?v=F7qOV8xonfY', // 10th clip, Tic-tac-toe
    'https://www.youtube.com/watch_popup?v=MpmGXeAtWUw'  // 11th clip, The only winning move
]

// random redirection
const redirect = () =>
{
    const url = URLs[Math.floor(Math.random() * URLs.length)]
    window.location = url
}

const LINES = 3 // size of a line
const BOARD_SIZE = LINES * LINES // size of the board
// marks are represented az 1, 0, -1 for X, empty square and O
const X = 1
const _ = 0
const O = -1

 // create a new state
const getCleanState = () => // (this would be a constructor in a proper OOP language)
{
    return {
        next: Math.random()<.5?X:O, // next player to move, a random player starts the game
        lastMove: null, // holds the last valid move's index
        numberOfMoves: 0,
        board: new Array(BOARD_SIZE).fill(_) // board state as a 1D Array of 9 integers..
        // no need to complicate deep copy even further, and using an integer as an index is simple
        // upper left corner is 0, the rest are in row-major order
        // https://en.wikipedia.org/wiki/Row-_and_column-major_order
    }
}

// deep copy a state
const getStateCopy = state => // it seems JS has no proper deep copy
{
    let newState = {...state} // create a new copy of the original object
    newState.board = Array.from(state.board) // the board array stays the same, copy that as well
    return newState // return the copy (steps could be "reverted", but this is simpler)
}

let active = false // is there a game in progress? the player can't put a mark outside games
let numberOfPlayers = 2 // default value, the number of players at start
let state = getCleanState() // this is the game state shown in the screen

// a dict for html codes to "print"
// FA icons were behaving weirdly on unusual screen sizes, SVG should be scalable
const markToHTML =
{
    '0': '',
    '1': // there must be a more elegant solution (maybe css' content?)
        `
        <svg width="100" height="100">
            <defs><filter id="gblur"><feGaussianBlur in="SourceGraphic" stdDeviation="1.3" /></filter></defs>
            <line x1="10%" y1="10%" x2="90%" y2="90%" filter="url(#gblur)"/>
            <line x1="10%" y1="90%" x2="90%" y2="10%" filter="url(#gblur)"/>
        </svg>
        `,
    '-1':
        `
        <svg width="100" height="100">
            <defs><filter id="gblur"><feGaussianBlur in="SourceGraphic" stdDeviation="1.3" /></filter></defs>
            <ellipse cx="50%" cy="50%" rx="35%" ry="35%" filter="url(#gblur)" />
        </svg>
        `
}

// winner's name to print (most of the time it's NONE - just like in the movie)
const winnerName =
{
    '0': 'NONE',
    '-1': 'O',
    '1': 'X'
}

// collect and store all the relevant HTML entities
const squares = Array.from(document.querySelectorAll('.square')) // collect all the squares
const messageSpan = document.querySelector('.message') // the green message bar at the top
const drawDiv = document.querySelector('#draw') // show the quote on a draw
const playerSelect = document.querySelector("select[name='number_of_players']") // dropdown menu for the number of players

// just a function to convert, only used for development, but shows the tile order
const rowColumnToSquare = (row, column) => LINES * row + column

// put a mark on the board
const putMarkSquare = (square, mark) => square.innerHTML = markToHTML[mark]
const putMarkSquareIndex = (squareIndex, mark) => putMarkSquare(squares[squareIndex], mark)

// shows or hides the quote
const setDrawVisible = status => drawDiv.style.display = status ? 'inline-block' : 'none'

// send a message to the user
const setMessage = (msg) => messageSpan.innerHTML = msg

// write whose turn it is
const writeTurn = (player) => setMessage(((player==X)?'X':'O') + "'s turn")

// set the squares to the board state
const printState = state =>
{
    squares.forEach((sq, index) => putMarkSquare(sq, state.board[index]))
    writeTurn(state.next)
}

// do a step, put a mark on a state's board
const step = (state, index) =>
{
    state.board[index] = state.next
    state.next = -state.next
    state.lastMove = index
    state.numberOfMoves += 1
}

// the only valid move is to put a mark on an _empty_ square
const validMove = (state, index) => state.board[index] === 0

// try to determine who won (if any)
// this has to be fast, there are a lot of boards to evaluate
// returns 1 or -1 if a player won (X or O), 0 for a draw and null if the game continues
const whoWon = state =>
{
    const possible = -state.next // possible winner can only be the last player who put a mark on the board
    const board = state.board // we'll use the board a lot, get a direct reference
    const column = state.lastMove % LINES // only the last move's column and row need to be checked
    const row = state.lastMove - column // these are the first squares in the row/column

    // check the diagonals
    // diagonals only matter if the player owns the middle square and the last move was in a diagonal or the center
    if((possible === board[4]) && (state.lastMove % 2 === 0))
    {
        if(((possible === board[0]) && (possible === board[8])) || ((possible === board[2]) && (possible === board[8-2])))
            return possible // "possible" won
    }

    // check the column
    if((possible === board[column]) && (possible === board[column + LINES]) && (possible === board[column + 2 * LINES]))
        return possible

    // check the row
    if((possible === board[row]) && (possible === board[row + 1]) && (possible === board[row + 2]))
        return possible

    // noone won so far, check if there are empty squares left
    if(state.numberOfMoves >= BOARD_SIZE)
        return 0 // stalemate

    return null // no winner so far, the match can go on
}

// some board values for Joshua from the moving player's point of view
const WINNING_VALUE = 1000
const LOSING_VALUE = -1000
const DRAW_VALUE = 0

// technically, a simplified variant of https://en.wikipedia.org/wiki/Negamax
// game state is small enough to be searched entirely, no need for maximum depth or any tricks
// returns a 2 element list (tuple) with the value and best move
const miniMax = (state) =>
{
    const anyoneWon = whoWon(state) // if the game is finished, the evaluation is exact
    if(anyoneWon!==null) // numerically this can be easily simplified
    {
        if(anyoneWon === 0)
            return [DRAW_VALUE, null]
        if(state.next === anyoneWon)
            return [WINNING_VALUE - state.numberOfMoves, null] // shorter wins are preferred
        return [LOSING_VALUE + state.numberOfMoves, null]
    }

    // "opening book", just to be less boring
    if(state.numberOfMoves === 0)
    {
        if(Math.random()<0.4) // put in the center most of the time
            return [0, 4]
        return [0, Math.floor(Math.random() * 5) * 2] // or corner/center
    }

    let bestValue = LOSING_VALUE // this holds the maximum value, everything has to be >= LOSING_VALUE
    let bestMove = null // the best move so far

    for(let i = 0; i < BOARD_SIZE; i++) // let's go through all the moves (in order, no need for tricks)
    {
        if(!validMove(state, i)) // if it's already taken, go on
            continue
        let newState = getStateCopy(state) // copy game state
        step(newState, i) // try this move
        let result = miniMax(newState) // evaluate this new state
        let value = -result[0] // negamax collects maximum of negative values ([0] is value, [1] is best step)

        // store this move as best if its value is bigger, or sometimes if equal
        // (don't make the same moves in the same situation, that's boring for the human player)
        if((value > bestValue) || ((value >= bestValue) && (Math.random()<0.2)))
        {
            bestValue = value
            bestMove = i
        }
    }

    return [bestValue, bestMove] // return with the best value and move
    // only one of them is used at a time, the minimax is only interested in its value
    // the calling function only needs the best move to make
}

// return it as an int
const getNumberOfPlayers = () => Number.parseInt(playerSelect.value)

// start button handler, starts a game
const startGame = () =>
{
    numberOfPlayers = getNumberOfPlayers() // get and store the number of players
    // if the user changes this in a game, doesn't matter
    if(numberOfPlayers === 0) // play movie clip :)
        redirect()
    active = true // activate the board
    state = getCleanState() // get a clean board
    printState(state) // show it on screen
    setDrawVisible(false) // disable the quote (if it was on display)
    Joshua(state) // if Joshua starts, let him move
}

// make a step, check if anyone won and handle these situations
const stepAndCheck = (state, index) =>
{
    step(state, index) // make the actual move
    printState(state) // show it on the screen
    const anyoneWon = whoWon(state) // check if it's game over
    if(anyoneWon!==null) // if yes
    {
        active = false // game over, disable the board
        setMessage('WINNER: ' + winnerName[anyoneWon] + ((numberOfPlayers === 1) ?
          ", WOULDN'T YOU PREFER A GOOD GAME OF CHESS?" : '')) // show the winner/loser/draw
        if(anyoneWon === 0)
            setTimeout(()=>setDrawVisible(true), 500) // after a while show the movie quote
            // let the player check the board first
    }
}

// handles Joshua's turn.. called after the player's move or game start
const Joshua = (state) =>
{
    if(numberOfPlayers === 1 && state.next === O) // Joshua is the opponent and it's his turn
    {
        let result = miniMax(state) // search the game tree
        stepAndCheck(state, result[1]) // make the best move available
    }
}

// event handler for the board tiles
const divPressed = index =>
{
    if(!active || !validMove(state, index))
        return // not in active game or not a valid move
    
    if(numberOfPlayers === 1 && state.next == O)
        return // Joshua's turn, leave the board alone! (he's probably faster than the player anyway)
    
    stepAndCheck(state, index) // make the/a player's move
    Joshua(state) // let Joshua move if he's the opponent
}

// add the event handler to the squares
squares.forEach((sq, idx) => sq.addEventListener('click', ()=>divPressed(idx)))

