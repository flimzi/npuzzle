import { Grid, PuzzleGrid } from "./grid.js"
import { EightPuzzle, Node } from "./npuzzle.js"
import { Direction, coordinateToDirection, getCoordinates, oppositeDirection } from './interface.js'

// first figure out how to perform simple moves of pieces

export function moveTileRaw(state, width, height, tileId, direction) {
    // good thing we thought about that earlier

    // it is weird that we need to initialize this here in order to make a simple change in an array of ints xd
    // refactor obviously (i think we need to move a lot of functionality to Grid class)
    const ep = new EightPuzzle(width, height, state)
    // looks weird with the 4
    const move = Grid.actions(width, height, tileId).find(([dir, _]) => dir == direction)

    if (move === undefined)
        return { state, action: null }

    // this is basically a node
    return { state: ep.result(state, move[1]), action: move[1] }
}

export function moveBlank(state, width, height, direction) {
    return moveTileRaw(state, width, height, state.indexOf(0), direction)
}

export function moveBlankTo(state, width, height, tileTo) {
    const blankCoordinates = getCoordinates(width, state.indexOf(0))
    const targetCoordinates = getCoordinates(width, tileTo)
    let node = new Node(state)

    const distance = {
        x: targetCoordinates.x - blankCoordinates.x,
        y: targetCoordinates.y - blankCoordinates.y
    }

    const direction = {
        x: coordinateToDirection(distance.x, 0),
        y: coordinateToDirection(0, distance.y)
    }

    const move = (node, direction, distance) => {
        let currentNode = node

        for (let i = 0; i < Math.abs(distance); i++) {
            const nextMove = moveBlank(currentNode.state, width, height, direction)
            currentNode = new Node(nextMove.state, currentNode, nextMove.action)
        }

        return currentNode
    }

    node = move(node, direction.x, distance.x)
    node = move(node, direction.y, distance.y)

    return node
}

// why is state and width height switched
export function movePiece(state, width, height, tile, direction) {
    // i guess return the sequence of operations going from the current state to where the tile is has been moved in the direction

    const tileFor0 = Grid.actions(width, height, tile).find(([dir]) => dir == direction)
    let node = new Node(state)

    if (tileFor0 === undefined)
        return node

    // fix the argument repassing
    node = moveBlankTo(node.state, width, height, tileFor0[1])
    node = moveBlank(node.state, width, height, oppositeDirection(direction))

    return node
}

// i think we will need to implement an a* algorithm for finding the path of the piece or 0 tile
// because now i can program a function that will move the 0 tile in front of the piece in question whilst ignoring it and insted going around it
// but later when many pieces are already in their place it could get difficult?