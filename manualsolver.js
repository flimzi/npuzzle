import { Grid, PuzzleGrid } from "./grid.js"
import { EightPuzzle, Node } from "./npuzzle.js"
import { Direction, coordinateToDirection, getCoordinates, oppositeDirection, getNode, getIndex, offset } from './interface.js'

export function moveTileRaw(nodeOrState, width, height, tileId, directionOrTile) {
    const node = getNode(nodeOrState)
    const ep = new EightPuzzle(width, height, node.state)
    const isString = typeof directionOrTile === 'string';
    const move = Grid.actions(width, height, tileId).find(([dir, id]) => directionOrTile === (isString ? dir : id))

    if (move === undefined)
        return node // not sure if this is good

    return new Node(ep.result(node.state, move[1]), node, move[1])
}

// export function moveTileRawTo(nodeOrState, width, height, tileId, tileTo) {
//     return moveTileRaw(nodeOrState, width, height, tileId, coordinateToDirection(offset(getCoordinates(height, tileId), getCoordinates(height, tileTo))))
// }

export function moveBlank(nodeOrState, width, height, directionOrTile) {
    const node = getNode(nodeOrState)
    return moveTileRaw(node, width, height, node.state.indexOf(0), directionOrTile)
}

export function moveBlankTo(nodeOrState, width, height, tileTo, xFirst = true) {
    let node = getNode(nodeOrState)
    const blankCoordinates = getCoordinates(width, node.state.indexOf(0))
    const targetCoordinates = getCoordinates(width, tileTo)

    const distance = {
        x: targetCoordinates.x - blankCoordinates.x,
        y: targetCoordinates.y - blankCoordinates.y
    }

    const direction = {
        x: coordinateToDirection(distance.x, 0),
        y: coordinateToDirection(0, distance.y)
    }

    const move = (initialNode, direction, distance) => {
        let currentNode = initialNode

        // pretty sure theres a more elegant way to do this
        for (let i = 0; i < Math.abs(distance); i++)
            currentNode = moveBlank(currentNode, width, height, direction)

        return currentNode
    }

    const [first, second] = xFirst ? ['x', 'y'] : ['y', 'x']
    node = move(node, direction[first], distance[first])
    node = move(node, direction[second], distance[second])

    return node
}

export function switchBlankWithTile(nodeOrState, width, height, tileId) {
    const node = getNode(nodeOrState)
    const move = Grid.actions(width, height, node.state.indexOf(0))
                     .find(([, tile]) => tile === tileId)

    if (move === undefined)
        return node

    return moveBlank(node, width, height, move[0])
}

// why is state and width height switched
export function movePiece(nodeOrState, width, height, tile, direction, immovable) {
    const tileFor0 = Grid.actions(width, height, tile).find(([dir]) => dir == direction)
    let node = getNode(nodeOrState)

    if (tileFor0 === undefined)
        return node

    // wont work because only tiles that we set beforehand are immovable and not the ones later in the array
    // const ummovable = node.state.filter((val, idx) => val !== 0 && val === goalState[idx])

    const coordinates = {
        blank: getCoordinates(height, width, node.state.indexOf(0)),
        target: getCoordinates(height, width, tile)
    }

    if (coordinates.blank.x === coordinates.target.x) {
        // need to move out the way up or down but this also depends on many factors such as are there tiles that cannot be moved anymore
        // checking for a grid border is easy enough but that last part basically needs to be done using a search
        // but maybe we could try doing this manually by checking if any tiles on a given path are ummovable and if possible choose the other path
        // but we need some kind of way to tell which indexes are ummovable which ig could be a parameter to this method
        // also this is not going to work for corner tiles and they need their own method that moves already correct tiles
        // and i actually think we need to write the "circling around" mechanism first because even some trivial movements will require that if a path is blocked by a correct piece
        // important: i think this method only works when the empty tile is at the end of the state but that shouldnt really be an issue
    }

    // fix the argument repassing
    // also i dont think this is enough to make this work
    // because if 0 is on the left of the tile and we want to move it right then it needs to
    // actually go around the tile (i guess this can be "solved" by moving the blank tile first up or down and then first going the x and then the y)
    // im pretty sure this could be done with a search that cannot move a certain tile (which in this case is the tile that is to be moved eventually)
    // manually this can be done by taking the coordinates of the blank and target tile 
    // check if the target tile is in the same row or column (depends) as the blank tile, if yes then make one legal move on the opposite axis
    // then move blank over there keeping in mind which has to be moved first x or y (depends)
    node = moveBlankTo(node, width, height, tileFor0[1])
    node = moveBlank(node, width, height, oppositeDirection(direction))

    return node
}

// i think we will need to implement an a* algorithm for finding the path of the piece or 0 tile
// because now i can program a function that will move the 0 tile in front of the piece in question whilst ignoring it and insted going around it
// but later when many pieces are already in their place it could get difficult?

//but how would it work? i guess it could be only responsible for getting the blank tile from any initial position to any target position
// then the logic behind where the blank tile has to go in order to make some sort of move of the pieces - is implemented outside of the search alotightm
// the blank tile cannot move into a forbidden tile that has a set position and cannot be moved