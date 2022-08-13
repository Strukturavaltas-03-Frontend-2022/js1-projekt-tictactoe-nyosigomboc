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

const URLs = 
[
    'https://www.youtube.com/watch?v=F7qOV8xonfY',
    'https://www.youtube.com/watch?v=MpmGXeAtWUw'
]

const redirect = () =>
{
    const url = URLs[Math.floor(Math.random() * URLs.length)]
    window.location = url
}

const LINES = 3 // size of a line
const BOARD_SIZE = LINES * LINES // size of the board
// marks are represented az 1, 0, -1 for X, empty square and O
const O = -1
const X = 1
const _ = 0

const getCleanState = () => // create a new state (this would be a constructor in a proper OOP language)
{
    return {
        next: Math.random()<.5?X:O, // next player to move, a random player starts the game
        lastMove: null, // holds the last valid move's index
        numberOfMoves: 0,
        board: new Array(BOARD_SIZE).fill(_) // board state as a 1D Array of 9 integers.. no need to complicate deep copy even further
    }
}

let active = false
let numberOfPlayers = 2
let state = getCleanState()

// a dict for html codes to "print"
const markToHTML =
{
    '0': '',
    '-1': '<i class="fa fa-circle-o" aria-hidden="true"></i>',
    '1': '<i class="fa fa-times" aria-hidden="true"></i>'
}

const winnerName =
{
    '0': 'NONE',
    '-1': 'O',
    '1': 'X'
}

const squares = Array.from(document.querySelectorAll('.square')) // collect all the squares
const messageSpan = document.querySelector('.message')
const drawDiv = document.getElementById('draw')

const rowColumnToSquare = (row, column) => LINES * row + column // just a function to convert

// put a mark on the board
const putMarkSquare = (square, mark) => square.innerHTML = markToHTML[mark]
const putMarkSquareIndex = (squareIndex, mark) => putMarkSquare(squares[squareIndex], mark)
const putMarkRC = (row, column, mark) => putMarkSquare(rowColumnToSquare(row, column), mark)

const setDrawVisible = status => drawDiv.style.display = status ? 'inline-block' : 'none'

// send a message to the user
const setMessage = (msg) => messageSpan.innerHTML=msg

// deep copy a state
const getStateCopy = state => // it seems JS has no deep copy
{
    let newState = {...state}
    newState.board = Array.from(state.board)
    return newState
}

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
const whoWon = state =>
{
    const possible = -state.next // possible winner can only be the last player who put a mark on the board
    const board = state.board // we'll use the board a lot, get a direct reference
    const column = state.lastMove % LINES // only the last move's column and row need to be checked
    const row = state.lastMove - column

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
    if(state.numberOfMoves === BOARD_SIZE)
        return 0 // stalemate

    return null // no winner so far, the match can go on
}

const getNumberOfPlayers = () => Number.parseInt(document.getElementsByName('number_of_players')[0].value)

const WINNING_VALUE = 1000
const LOSING_VALUE = -1000
const DRAW_VALUE = 0

// technically, a simplified variant of https://en.wikipedia.org/wiki/Negamax
// game state is small enough to be searched entirely, no need for maximum depth
const miniMax = (state) =>
{
    const anyoneWon = whoWon(state) // if the game is finished, the evaluation is exact
    if(anyoneWon!==null)
    {
        if(anyoneWon === 0)
            return [DRAW_VALUE, null]
        if(state.next === anyoneWon)
            return [WINNING_VALUE, null]
        return [LOSING_VALUE, null] // this should be unnecessary
    }

    // "opening book", just to be less boring
    if(state.numberOfMoves === 0)
    {
        if(Math.random()<0.4) // put in the center most of the time
            return [0, 4]
        return [0, Math.floor(Math.random() * 5) * 2] // or corner/center
    }

    let bestValue = LOSING_VALUE
    let bestMove

    for(let i = 0; i < BOARD_SIZE; i++)
    {
        if(!validMove(state, i))
            continue
        let newState = getStateCopy(state)
        step(newState, i) // try this move
        let result = miniMax(newState) // evaluate this new state
        let value = -result[0]
        if(value === WINNING_VALUE)
            return [value, i] // if Joshua can win, do that.. even if there are even better moves
        if((value > bestValue) || ((value >= bestValue) && (Math.random()<0.2)))
        {
            bestValue = value
            bestMove = i
        }
    }

    return [bestValue, bestMove]
}

// start button
const startGame = () =>
{
    numberOfPlayers = getNumberOfPlayers()
    if(numberOfPlayers === 0) // play movie clip :)
        redirect()
    active = true
    state = getCleanState()
    printState(state)
    setDrawVisible(false)
    Joshua(state)
}

const stepAndCheck = (state, index) =>
{
    step(state, index)
    printState(state)
    const anyoneWon = whoWon(state)
    if(anyoneWon!==null)
    {
        active = false
        setMessage('WINNER: ' + winnerName[anyoneWon])
        if(anyoneWon === 0)
            setTimeout(()=>setDrawVisible(true), 500)
    }
}

// handles Joshua's turn.. called after the player's move or game start
const Joshua = (state) =>
{
    if(numberOfPlayers === 1 && state.next === O)
    {
        let result = miniMax(state)
        stepAndCheck(state, result[1])
    }
}

// event handler
const divPressed = index =>
{
    if(!active || !validMove(state, index))
        return // not in active game or not a valid move
    
    if(numberOfPlayers === 1 && state.next == O)
        return // Joshua's turn
    
    stepAndCheck(state, index)
    Joshua(state)
}

// add the event handler to the squares
squares.forEach((sq, idx) => sq.addEventListener('click', ()=>divPressed(idx)))




