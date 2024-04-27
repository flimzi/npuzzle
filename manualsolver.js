import { PuzzleGrid } from "./grid.js"
import { Direction } from './interface.js'

// first figure out how to perform simple moves of pieces

export const eightPuzzle = new EightPuzzle(4)

export function moveTileRaw(state, tileId, direction) {
    // good thing we thought about that earlier

    const ep = new PuzzleGrid(4, 4, state)
    const action = ep.emptyActions(tileId).find(([dir, act]) => dir == direction)

    if (action === undefined)
        return state

    return ep.result(state, action)
}

export function moveBlank(state, direction) {
    return moveTileRaw(state, state.indexOf(0), direction)
}

export function moveBlankTo(state, tileTo) {
    // get manhattan distance to the tile
}

export function movePiece(state, tile, direction) {
    // i guess return the sequence of operations going from the current state to where the tile is has been moved in the direction

    const blankTile = state.indexOf(0) // could be abstracted into a class later

    // start moving the empty tile so that it is next to the tile to be moved
    // find the distance from the current coordinates to the coordinates of the 
}