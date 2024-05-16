import { PuzzleGrid } from './grid.js'
import { EightPuzzle } from './npuzzle.js'
import { moveBlank } from './manualsolver.js'
import * as iface from './interface.js'

// implement search function for moving a blank to a given space without disrupting set tiles
// most if not all of these methods could just reside in eightpuzzle because they are not relying on the html
export default class PuzzleGridEndBlank extends PuzzleGrid {
    constructor(width, height = null, initialState = null) {
        super(width, height, initialState, EightPuzzle.generateGoalStateEndBlank(width, height))
    }

    async searchMoveBlankTo(tileId, avoid = []) {
        const result = new EightPuzzle(this.width, this.height, this.getState(), this.puzzle.goalState).searchMoveBlankTo(tileId, avoid)

        if (result === null)
            return false

        await this.moveFromEndNode(result)
        return true
    }

    async movePieceManually(tileId, distance, direction) {
        const pieceId = this.grid[tileId].piece.pieceId

        for (const id of this.getBlankPositions(tileId, distance, direction)) {
            const state = this.getState()
            
            // is this right?
            if (!await this.searchMoveBlankTo(id, [state.indexOf(pieceId)]))
                return false

            await this.moveFromEndNode(moveBlank(state, this.width, this.height, iface.oppositeDirection(direction)))
        }

        return true
    }

    movePieceManuallyByPiece(pieceId, distance, direction) {
        return this.movePieceManually(this.getTileFromPiece(pieceId), distance, direction)    
    }

    actionsWithAvoidance(tileId, avoid = []) {
        return this.actions(tileId).filter(([, id]) => !avoid.includes(id))
    }

    getBlankPositions(tileId, distance, direction, avoid = []) {
        const positions = []
        let xy = iface.getCoordinates(this.width, tileId)

        for (let moved = 0; moved < distance; moved++) {
            // no real need for avoid here but convenient (unless not)
            const move = this.actionsWithAvoidance(iface.getIndex(xy.x, xy.y, this.width), avoid)
                             .find(([dir]) => dir === direction)

            if (move === undefined)
                return []

            xy = iface.offset(xy, iface.directionToCoordinates(direction))
            positions.push(move[1])
            // complete movement
            // const offset = iface.offset(xy, iface.directionToCoordinates(iface.oppositeDirection(direction)))
            // positions.push(iface.getIndex(offset.x, offset.y, this.width))
        }

        return positions
    }

    searchMovePieceTo(pieceId, tileTo, avoid = []) {
        // not sure if this doable or how to do it but try moving a piece one distance at a time towards the goal tile
        // basically we need to obtain the sequence of directions the piece needs to move 
        // so i guess the actions will be the blank positions that the piece can move to
        // and the heuristic will be how far away from the goal in manhattan distance the piece will be after the resultant move \
        // (which also is the same blank position because the piece is going to move into it)

        const puzzle = new EightPuzzle(this.width, this.height, this.getState(), this.puzzle.goalState)
        const { goalX, goalY } = getCoordinates(this.width, tileTo)

        const h = node => {
            const { tileX, tileY } = getCoordinates(this.width, node.state.indexOf(pieceId))
            return EightPuzzle.manhattanDistance(goalX, goalY, tileX, tileY)
        }

        let node = new Node(puzzle.initialState)
        const frontier = new PriorityQueue([node], (a, b) => h(a) - h(b))
        const reached = {[puzzle.initialState]: node}

        while (!frontier.isEmpty()) {
            node = frontier.pop()

            if (node.state.indexOf(pieceId) === tileTo)
                return node
            
            // we probably need a more discrete representation of the movement of the piece in a given direction 
            // we do kinda have a way to do this ahead of time using the movepiecemanually but it needs to be first moved to npuzzle.js
            // then we will be able to create the proper result nodes in place of this expandnode
            for (let child of this.expandNode(node)) {
                let s = child.state
                
                if (!(s in reached) || child.pathCost < reached[s].pathCost) {
                    reached[s] = child
                    frontier.add(child)
                }
            }
        }

        return null
    }

    async trySolve() {
        // to fix the problem of not knowing what path the piece should take we can abstract moving the piece in 4 directions if possible using the blank
        // and make the search again (but maybe there is an easier way, for example check the 2 possible ways you can go (xfirst or y first) and choose the one without obstacles)
        // but for the rotation we have to hardcode a method for rotating forward and backwards

        // this will need to decide how to move a piece somewhere (either by search failure or by checking for a corner tile where the rotation needs to be used)
        // also we cannot really map a promise to a tile because the search is not ahead-of-time
        // return this.puzzle.goalState.every(async (pieceId, tileId) => await this.movePieceManuallyByPiece(pieceId, ))
    
        // need to check if searchmovepieceto works with avoid not empty
        // and implement the rotation
        // and pictures
        // and fix movement lock
        // and add touch support
        // and i guess add tests but i know for sure there are problems like you cannot probably have 2 puzzlegrids on the same page

        
    }
}

// im pretty sure there is an issue with setting position of pieces upon movement (either computed or manual) because depending on what tile the piece 2 is in
// the text "2" is closer or further away from the beginning of the red piece, which probably has something to do with the piece locking up when you try to move it sometimes