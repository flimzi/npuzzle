// need a data structre representing a 2d AxB grid where things can be placed in tiles
// this can either be done by keeping track of empty tiles and given a tile a set of possible actions to adjacent empty and existing tiles can be returned
// after such a movement the grid is updated to keep track of empty tiles
// however we also need a way of keeping track of arbitrary objects that reside in the tiles for this to have a functional value
// so i guess except for or apart from keeping track of empty tiles we can have a pointer to its contents

// i doubt there is need for this class right now
import { EightPuzzle, Node } from "./npuzzle.js"

const Direction = {
    Right: 'Right',
    Left: 'Left',
    Up: 'Up',
    Down: 'Down'
}

const Axis = {
    X: 'X',
    Y: 'Y',
    Both: 'Both',
    None: 'None'
}

export const WorkerMessageType = {
    Initialization: 'Initialization',
    Polling: 'Polling',
    Result: 'Result'
}

export function WorkerMessage(type, value = null) {
    this.type = type
    this.value = value
}

class Grid {
    constructor(width, height = null) {
        this.width = width
        this.height = height || width
        this.grid = Array(this.width * this.height).fill(null)
    }

    *get2D() {
        for (let row = 0; row < this.height; row++) {
            const start = row * this.width
            yield this.grid.slice(start, start + this.width)
        }
    }

    actions(cellId) {
        const cellX = cellId % this.width
        const cellY = Math.floor(cellId / this.width)
        const adjacent = []

        if (cellX > 0)
            adjacent.push([Direction.Left, cellId - 1])

        if (cellX < this.width - 1)
            adjacent.push([Direction.Right, cellId + 1])

        if (cellY > 0)
            adjacent.push([Direction.Up, cellId - this.width])

        if (cellY < this.height - 1)
            adjacent.push([Direction.Down, cellId + this.width])

        return adjacent.toSorted()
    }

    emptyActions(cellId) {
        return this.actions(cellId).filter(([_, id]) => this.isCellEmpty(this.grid[id]))
    }

    isCellEmpty(cell) {
        return cell === null
    }

    move(cellFromId, cellToId) {
        this.grid[cellToId] = this.grid[cellFromId]
        this.grid[cellFromId] = null
    }
}

Object.prototype.toArray = () => [...this]

Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)]
}

const grid1 = new Grid(3)
const grid12d = [...grid1.get2D()]

grid1.grid[1] = 'test'
// console.log(grid12d)
// console.log(grid1.emptyActions(0))

// this only works when you set width or height in css
class DivGrid extends Grid {
    constructor(width, height = null) {
        super(width, height)

        for (const [tileId, _] of this.grid.entries()) {
            const $tile = document.createElement('div')
            $tile.piece = null
            $tile.tileId = tileId
            $tile.setAttribute('data-tile', $tile.tileId)
            this.grid[tileId] = $tile
        }

        this.edit = false
    }

    addPiece(tileId = null) {
        if (tileId === null)
            tileId = this.grid.findIndex($tile => this.isCellEmpty($tile))

        const $piece = document.createElement('div')
        $piece.pieceId = $piece.tileId = tileId
        $piece.setAttribute('data-piece', $piece.pieceId)
        $piece.setAttribute('data-in', tileId)
        // $piece.setAttribute('draggable', 'true')
        $piece.style.position = 'absolute'
        $piece.style.cursor = 'grab'
        $piece.actions = []
        $piece.innerText = tileId
        this.grid[tileId].piece = $piece

        $piece.getPlacement = () => {
            const pieceRect = $piece.getBoundingClientRect()
            const pieceArea = pieceRect.width * pieceRect.height

            return this.grid.map($tile => {
                const tileRect = $tile.getBoundingClientRect() //can be stored on resize

                const overlapArea = {
                    left: Math.max(pieceRect.left, tileRect.left),
                    right: Math.min(pieceRect.right, tileRect.right),
                    top: Math.max(pieceRect.top, tileRect.top),
                    bottom: Math.min(pieceRect.bottom, tileRect.bottom)
                }
        
                const overlapWidth = overlapArea.right - overlapArea.left
                const overlapHeight = overlapArea.bottom - overlapArea.top
        
                if (overlapWidth <= 0 || overlapHeight <= 0)
                    return [$tile, 0]

                return [$tile, (overlapWidth * overlapHeight) / pieceArea] // this would be better as an object i think
            })
        }
    }

    filledTiles() {
        return this.grid.filter(t => !this.isCellEmpty(t)).map(t => [t, t.piece])
    }

    draw(gap = 2) {
        const $grid = document.createElement('div')
        $grid.style.display = 'grid'
        $grid.style.boxSizing = 'border-box'

        const resizeObserver = new ResizeObserver(entries => {
            // these operations should probably be postponed whenever an event handler
            // but idk if this even works on resize so

            // const tileSize = $grid.clientWidth < $grid.clientHeight
            //     ? $grid.clientWidth / this.width
            //     : $grid.clientHeight / this.height

            const style = window.getComputedStyle($grid)
            this.borderWidth = parseInt(style.getPropertyValue('border'))
            this.gapWidth = parseInt(style.getPropertyValue('gap'))
            this.gridRect = $grid.getBoundingClientRect()
            const verticalGapWidth = (this.height - 1) * this.gapWidth + 2 * this.borderWidth
            const horizontalGapWidth = (this.width - 1) * this.gapWidth + 2 * this.borderWidth
            
            const tileSize = $grid.clientWidth < $grid.clientHeight
                ? ($grid.offsetWidth - horizontalGapWidth) / this.width
                : ($grid.offsetHeight - verticalGapWidth) / this.height

            $grid.style.gridTemplateColumns = `repeat(${this.width}, ${tileSize}px)`
            $grid.style.gridTemplateRows = `repeat(${this.height}, ${tileSize}px)`

            // set size and position of pieces (nobody knows if this will work)
            for (const [$tile, $piece] of this.filledTiles()) {
                const tileRect = $tile.getBoundingClientRect()

                $piece.style.width = tileRect.width + 'px'
                $piece.style.height = tileRect.height + 'px'
                $piece.style.top = tileRect.top + 'px'
                $piece.style.left = tileRect.left + 'px'
            }
        })

        resizeObserver.observe($grid)

        for (const $tile of this.grid) {
            $grid.appendChild($tile)

            // this does not support removing pieces from the grid, only changing their position
            if (!this.isCellEmpty($tile)) {
                const $piece = $tile.piece
                
                $grid.appendChild($piece)
                $piece.addEventListener('mousedown', this.movePieceMouseDown)
            }
        }

        this.$grid = $grid // temporary
        return $grid
    }

    movePieceMouseDown = e => {
        if (!this.edit)
            return

        const $piece = e.currentTarget
        $piece.actions = this.emptyActions(e.target.tileId)
        $piece.style.cursor = window.document.body.style.cursor = 'grabbing'
        $piece.initialRect = e.target.getBoundingClientRect()
        $piece.movement = Axis.None
        const movePieceWindow = this.movePieceWindowGap($piece)

        const movePieceMouseLeaveWindow = e => {
            window.removeEventListener('mousemove', movePieceWindow)
            window.removeEventListener('mouseup', movePieceMouseLeaveWindow)
    
            $piece.actions = []
            $piece.style.cursor = 'grab'
            window.document.body.style.cursor = 'default'
            const $targetTile = $piece.getPlacement().filter(t => t[0].piece === null || t[0].piece === $piece)
                                                        .toSorted((a, b) => b[1] - a[1])[0][0]
    
            const targetRect = $targetTile.getBoundingClientRect()
            $piece.style.width = targetRect.width + 'px'
            $piece.style.height = targetRect.height + 'px'
    
            $piece.style.top = targetRect.top + 'px'
            $piece.style.left = targetRect.left + 'px'
            this.grid[$piece.getAttribute('data-in')].piece = null
            $piece.setAttribute('data-in', $targetTile.tileId)
            $piece.actions = this.emptyActions($targetTile.tileId)
            $piece.tileId = $targetTile.tileId
            $targetTile.piece = $piece
        }

        window.addEventListener('mousemove', movePieceWindow)
        window.addEventListener('mouseup', movePieceMouseLeaveWindow)
    }

    movePieceMouseWindow3 = $piece => e => {
        e.preventDefault()

        if (e.buttons !== 1) {
            window.dispatchEvent(new MouseEvent('mouseup'))
            return
        }

        const pieceRect = $piece.getBoundingClientRect()
        const directions = $piece.actions.map(a => a[0])
        let [movementX, movementY] = [e.movementX, e.movementY]

        // not sure if rounding is that good here
        // const coordinates = {
        //     initial: { X: Math.round($piece.initialRect.left), Y: Math.round($piece.initialRect.top) },
        //     current: { X: Math.round(pieceRect.left), Y: Math.round(pieceRect.top) },
        // }

        // this works better so far because the piece doesnt lock up
        const coordinates = {
            initial: { X: $piece.initialRect.left, Y: $piece.initialRect.top },
            current: { X: pieceRect.left, Y: pieceRect.top },
        }

        const canMove = direction => directions.includes(direction)

        const moveTo = (X = null, Y = null) => {
            $piece.style.left = (X || coordinates.current.X) + 'px'
            $piece.style.top = (Y || coordinates.current.Y) + 'px'
        }

        if (coordinates.current.X < coordinates.initial.X && !canMove(Direction.Left)) {
            moveTo(coordinates.initial.X)
            return
        }

        if (coordinates.current.X > coordinates.initial.X && !canMove(Direction.Right)) {
            moveTo(coordinates.initial.X)
            return
        }

        if (coordinates.current.Y < coordinates.initial.Y && !canMove(Direction.Up)) {
            moveTo(null, coordinates.initial.Y)
            return
        }

        if (coordinates.current.Y > coordinates.initial.Y && !canMove(Direction.Down)) {
            moveTo(null, coordinates.initial.Y)
            return
        }

        // the gap bullshit is actually hella dangerous because it needs to be included in most of the calculations here
        // but it could acually help us get smoother motion except that its a lot of work potentially for a small gain to our use case
        // but that could make this code have a little bit more merit 
        // if we included the gaps in the possible range of movements of the pieces on the board
        // we should also do the bound checking ahead of time to avoid jittering of the pieces
        if (coordinates.current.X < coordinates.initial.X - pieceRect.width) {
            moveTo(coordinates.initial.X - pieceRect.width)
            return
        }

        if (coordinates.current.X > coordinates.initial.X + pieceRect.width) {
            moveTo(coordinates.initial.X + pieceRect.width)
            return
        }

        if (coordinates.current.Y < coordinates.initial.Y - pieceRect.height) {
            moveTo(null, coordinates.initial.Y - pieceRect.height)
            return
        }

        if (coordinates.current.Y > coordinates.initial.Y + pieceRect.height) {
            moveTo(null, coordinates.initial.Y + pieceRect.height)
            return
        }

        const difference = {
            X: Math.abs(coordinates.current.X - coordinates.initial.X),
            Y: Math.abs(coordinates.current.Y - coordinates.initial.Y),
        }

        if (difference.X > 0 && difference.Y > 0) {
            if (difference.Y < difference.X) {
                moveTo(null, coordinates.initial.Y)
                return
            }

            if (difference.X < difference.Y) {
                moveTo(coordinates.initial.X)
                return
            }
        }

        console.log(this.gapWidth)

        moveTo(coordinates.current.X + movementX, coordinates.current.Y + movementY)
    }

    movePieceWindowGap = $piece => e => {
        e.preventDefault()

        if (e.buttons !== 1) {
            window.dispatchEvent(new MouseEvent('mouseup'))
            return
        }

        const currentRect = $piece.getBoundingClientRect()
        const directions = $piece.actions.map(a => a[0])
        // const directions = []
        let [movementX, movementY] = [e.movementX, e.movementY]
        let [finalX, finalY] = [currentRect.x + movementX, currentRect.y + movementY]

        const canMove = direction => directions.includes(direction)

        const moveTo = (x = null, y = null) => {
            $piece.style.left = (x || currentRect.x) + 'px'
            $piece.style.top = (y || currentRect.y) + 'px'
        }

        // check grid bounds
        finalX = Math.max(finalX, this.gridRect.x + this.borderWidth)
        finalX = Math.min(finalX, this.gridRect.x + (this.gridRect.width - currentRect.width - this.borderWidth))
        finalY = Math.max(finalY, this.gridRect.y + this.borderWidth)
        finalY = Math.min(finalY, this.gridRect.y + (this.gridRect.height - currentRect.height - this.borderWidth))

        // check movement direction
        if (!canMove(Direction.Left))
            finalX = Math.max(finalX, $piece.initialRect.x - this.gapWidth)

        if (!canMove(Direction.Right))
            finalX = Math.min(finalX, $piece.initialRect.x + this.gapWidth)

        if (!canMove(Direction.Up))
            finalY = Math.max(finalY, $piece.initialRect.y - this.gapWidth)

        if (!canMove(Direction.Down))
            finalY = Math.min(finalY, $piece.initialRect.y + this.gapWidth)

        // limit distance
        const distanceLimit = currentRect.width + this.gapWidth
        finalX = Math.max(finalX, $piece.initialRect.x - distanceLimit)
        finalX = Math.min(finalX, $piece.initialRect.x + distanceLimit)
        finalY = Math.max(finalY, $piece.initialRect.y - distanceLimit)
        finalY = Math.min(finalY, $piece.initialRect.y + distanceLimit)

        // restrict diagonal movement
        let distance = {
            x: finalX - $piece.initialRect.x,
            y: finalY - $piece.initialRect.y,
        }
        distance.abs = { x: Math.abs(distance.x), y: Math.abs(distance.y) }

        if (distance.abs.x > this.gapWidth && distance.abs.y > this.gapWidth) {
            if (distance.abs.x <= distance.abs.y)
                finalX = $piece.initialRect.x + this.gapWidth * (distance.x < 0 ? -1 : 1) 
            else
                finalY = $piece.initialRect.y + this.gapWidth * (distance.y < 0 ? -1 : 1)
        }

        moveTo(finalX, finalY)
    }

    movePieceMouseLeave = e => {
        e.target.actions = []
        e.target.style.cursor = 'grab'
        e.target.removeEventListener('mousemove', this.movePieceMouse)
        const $targetTile = this.grid[e.target.getPlacement().toSorted((a, b) => b[1] - a[1])[0][0]]

        e.target.style.width = $targetTile.clientWidth + 'px'
        e.target.style.height = $targetTile.clientHeight + 'px'

        const tileRect = $targetTile.getBoundingClientRect()
        e.target.style.top = tileRect.top + 'px'
        e.target.style.left = tileRect.left + 'px'
        this.grid[e.target.getAttribute('data-in')].piece = null
        e.target.setAttribute('data-in', $targetTile.tileId)
        e.target.actions = this.emptyActions($targetTile.tileId)
        e.target.tileId = $targetTile.tileId
        $targetTile.piece = e.target
    }

    // unless we narrow the query selector to grid parent element we cannot use queryselector here (we have no handle for the grid div anyway)
    movePiece(tileFromId, tileToId, duration = 50) {
        const $tileFrom = this.grid[tileFromId]
        const $tileTo = this.grid[tileToId]
        const $piece = $tileFrom.piece
        const tileToRect = $tileTo.getBoundingClientRect()
        const grid = this
        const edit = grid.edit

        $piece.style.top = tileToRect.top + 'px'
        $piece.style.left = tileToRect.left + 'px'
        $tileFrom.piece = null
        $tileTo.piece = $piece
        $piece.setAttribute('data-in', tileToId)
        $piece.style.transition = `top ${duration}ms linear, left ${duration}ms linear`

        return new Promise(r => {
            setTimeout(() => {
                $piece.style.transition = ''
                grid.edit = edit
                r()
            }, duration + 50)
        })
    }

    isCellEmpty(cell) {
        return cell.piece === null
    }
}

export class PuzzleGrid extends DivGrid {
    constructor(width, height = null) {
        super(width, height)

        // for (let i = 1; i < this.grid.length; i++)
        //     this.addPiece(i)

        this.addPiece(2)
        this.goalState = this.getState()

        if (this.width == 3 && this.height == 3)
            this.eightPuzzleStates = this.generate8PuzzleStates()
    }

    async generate8PuzzleStates() {
        return new Promise(resolve => {
            const worker = new Worker('stateWorker.js', { type: 'module' });
            worker.onmessage = event => resolve(event.data)
        })
    }

    test() {
        const worker = new Worker('bfsWorker.js', { type: 'module' })

        worker.onmessage = ({ data }) => {
            // could it be the case that the worker is working too hard on the search that it cannt respond to messages?
            // i guess so but in that case what other options even are there
            // except for ig i dont know
            switch (data.type) {
                case WorkerMessageType.Polling:
                    console.log(data.value)
                    break;
                case WorkerMessageType.Result:
                    console.log(Node.path(data.value))
                    debugger
                    break;
            }
        }

        worker.postMessage(new WorkerMessage(WorkerMessageType.Initialization, new EightPuzzle(this.width, this.height, this.getState())))
        setInterval(worker.postMessage(new WorkerMessage(WorkerMessageType.Polling)), 10)
    }

    getState() {
        return this.grid.map(tile => tile.piece !== null ? tile.piece.pieceId : 0)
    }

    // test this
    *getStates(goal) {
        return new EightPuzzle(this.width, this.height, this.getState(), goal).aStarSearch().getPath()
    }

    moveToNextState(state) {
        for (const $tile of this.grid) {
            const pieceId = state[$tile.tileId]

            if ($tile.piece === null)
                continue

            if ($tile.piece.pieceId === pieceId)
                continue

            return this.movePiece($tile.tileId, state.indexOf($tile.piece.pieceId))
        }
    }

    async *moveToState(state, states = null) {
        const puzzle = new EightPuzzle(this.width, this.height, this.getState(), state)
        // refactor too convoluted
        const search = states !== null ? puzzle.bestFirstSearch(node => node.pathCost + states[node.state]) : puzzle.aStarSearch()

        for (const node of search.getPath())
            yield this.moveToNextState(node.state)
    }

    async moveToStateConditionally(state, condition = null, states = null) {
        condition = condition || (() => true)

        for await (const promise of this.moveToState(state, states)) {
            if (!condition())
                return

            await promise
        }
    }

    async shuffle(condition = null) {
        await this.moveToStateConditionally(EightPuzzle.generateValidPuzzleState(this.width, this.height), condition)
    }

    async randomShuffle(condition = null) {
        const puzzle = new EightPuzzle(this.width, this.height, this.getState())
        let state = puzzle.initialState.slice()
        let previous0
        condition = condition || (() => true)

        while (condition()) {
            const nextState = puzzle.result(state, puzzle.actions(state).filter(i => i !== previous0).random())
            await this.moveToNextState(nextState)
            previous0 = state.indexOf(0)
            state = nextState
        }
    }

    async solve(condition = null) {
        let states = null

        // if (this.eightPuzzleStates !== undefined)
        //     states = await this.eightPuzzleStates.then(states => states)

        await this.moveToStateConditionally(this.goalState, condition, states)
    }

    setPicture() {
        // here we need to use css to cut up a photo (possibly upload but i will do it with url for now and also it will facilitate the lorep picsum or whatever)
        // would be nice to future proof this so that the photos are picked with the kinda correct ratio
        // but from what i can see going to 3x4 the npuzzle logic does not work anymore and just hangs the browser
        // which is why we should offload the computation to a worker i guess or do it asynchronously
    }
}

// would it even be possible to record the costs of moving pieces from the fringe to anywhere on the 4x4 board
// then use bfs to solve the fringe state and then map the states from the 3x3 space state to the resulting 3x3 puzzle???
export class ProceduralSolver {

}

// later we could do the same database but for the 8 puzzle that comes up as a result of setting up correct digits in the fringe part of a 15 puzzle
