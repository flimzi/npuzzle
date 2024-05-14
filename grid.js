// need a data structre representing a 2d AxB grid where things can be placed in tiles
// this can either be done by keeping track of empty tiles and given a tile a set of possible actions to adjacent empty and existing tiles can be returned
// after such a movement the grid is updated to keep track of empty tiles
// however we also need a way of keeping track of arbitrary objects that reside in the tiles for this to have a functional value
// so i guess except for or apart from keeping track of empty tiles we can have a pointer to its contents

// i doubt there is need for this class right now
import { EightPuzzle, Node } from "./npuzzle.js"
import { Direction, Axis, WorkerMessageType, stateTo2d, offset, getDistance } from './interface.js'
import { switchBlankWithTile } from './manualsolver.js'

export class Grid {
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

    static actions(width, height, cellId) {
        const cellX = cellId % width
        const cellY = Math.floor(cellId / width)
        const adjacent = []

        if (cellX > 0)
            adjacent.push([Direction.Left, cellId - 1])

        if (cellX < width - 1)
            adjacent.push([Direction.Right, cellId + 1])

        if (cellY > 0)
            adjacent.push([Direction.Up, cellId - width])

        if (cellY < height - 1)
            adjacent.push([Direction.Down, cellId + width])

        return adjacent
    }

    actions(cellId) {
        return Grid.actions(this.width, this.height, cellId)
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

Array.prototype.shiftLeft = function() {
    return this.unshift(this.pop())
}

Array.prototype.shiftRight = function() {
    return this.push(this.shift())
}

Array.prototype.toShiftedLeft = function(times = 1) {
    const n = times % this.length
    return this.slice(n).concat(this.slice(0, n))
}

Array.prototype.toShiftedRight = function(times = 1) {
    return this.toShiftedLeft(-times)
}

const grid1 = new Grid(3)
const grid12d = [...grid1.get2D()]

grid1.grid[1] = 'test'
// console.log(grid12d)
// console.log(grid1.emptyActions(0))

// this only works when you set width or height in css
// need to fix because it sometimes jams when trying to drag with mouse
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

    tileLoop() {
        return [...EightPuzzle.tileLoop(this.width, this.height, this.getState())].map(tile => { return { ...tile, val: this.grid[tile.idx] }})
    }

    pieceLoop() {
        return this.tileLoop().map(({val}) => val.piece).filter(piece => piece !== null)
    }

    addPiece(tileId = null, pieceId = null) {
        if (tileId === null)
            tileId = this.grid.findIndex($tile => this.isCellEmpty($tile))

        const $piece = document.createElement('div')
        $piece.pieceId = pieceId ?? tileId
        // IMPORTANT CHANGE
        $piece.tileId = tileId
        //
        $piece.setAttribute('data-piece', $piece.pieceId)
        $piece.setAttribute('data-in', tileId)
        // $piece.setAttribute('draggable', 'true')
        $piece.style.position = 'absolute'
        $piece.style.cursor = 'grab'
        $piece.actions = []
        $piece.innerText = $piece.pieceId
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

    // remember that there is a addEventListener option ONCE
    // WHY DID GPT NOT KNOW THIS
    movePieceMouseDown = eMouseDown => {
        if (!this.edit)
            return

        const $piece = eMouseDown.currentTarget
        $piece.actions = this.emptyActions(eMouseDown.target.tileId)
        $piece.style.cursor = window.document.body.style.cursor = 'grabbing'
        $piece.initialRect = eMouseDown.target.getBoundingClientRect()
        $piece.movement = Axis.None
        // somehow make it so that within a couple pixels of the mousedown position, nothing happens
        // and only if you drag the mouse outside that region should the movement code run
        // i think maybe the most idiomatic way is to have another listener before the main one that handles this 
        $piece.style.zIndex = 1000

        const movePieceWindow = this.movePieceWindowGap($piece, eMouseDown)

        const movePieceMouseLeaveWindow = e => {
            window.removeEventListener('mousemove', movePieceWindow)
            window.removeEventListener('mouseup', movePieceMouseLeaveWindow)

            $piece.actions = []
            $piece.style.cursor = 'grab'
            window.document.body.style.cursor = 'default'
            // this is an issue because this also gets called when click switch and the target tile is obviously the same as in the beginning because it was just a click
            // this gets called before movepiece so most of it gets overridden but there is a value that gets mixed up and when mousedown sets actions
            // it does it wrong
            const $targetTile = $piece.getPlacement().filter(t => t[0].piece === null || t[0].piece === $piece)
                                                     .toSorted((a, b) => b[1] - a[1])[0][0]
    
            const targetRect = $targetTile.getBoundingClientRect()
            $piece.style.width = targetRect.width + 'px'
            $piece.style.height = targetRect.height + 'px'
            $piece.style.boxShadow = ''
            $piece.style.zIndex = 1
    
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

        // console.log(this.gapWidth)

        moveTo(coordinates.current.X + movementX, coordinates.current.Y + movementY)
    }

    // need to examine this because something happens differently even though the final positions in both move methods are the same
    movePieceWindowGap = ($piece, eMouseDown) => eMouseMove => {
        eMouseMove.preventDefault()

        // stagger
        if (!eMouseDown.unlocked) {
            if (getDistance(eMouseDown, eMouseMove) > 5) {
                eMouseDown.unlocked = true
                $piece.style.boxShadow = '0px 2px 14px 6px rgba(0, 0, 0, 1)'
            }

            return
        }

        if (eMouseMove.buttons !== 1) {
            window.dispatchEvent(new MouseEvent('mouseup'))
            return
        }

        const currentRect = $piece.getBoundingClientRect()
        const directions = $piece.actions.map(a => a[0])
        // const directions = []
        let [movementX, movementY] = [eMouseMove.movementX, eMouseMove.movementY]
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
    // this somehow works differently from drag and drop because it fucks up the movements
    // also might be because mouseup gets executed along with this
    movePiece(tileFromId, tileToId, duration = 50) {
        const $tileFrom = this.grid[tileFromId]
        const $tileTo = this.grid[tileToId]
        const $piece = $tileFrom.piece
        const tileToRect = $tileTo.getBoundingClientRect()
        const grid = this
        const edit = grid.edit

        $piece.style.top = tileToRect.top + 'px'
        $piece.style.left = tileToRect.left + 'px'
        // $piece.style.boxShadow = '8px 8px 14px 0px rgba(66, 68, 90, 1)'
        // should be a class or attrbiute obv
        $piece.style.boxShadow = '0px 2px 14px 6px rgba(0, 0, 0, 1)'
        $tileFrom.piece = null
        $tileTo.piece = $piece
        $piece.tileId = tileToId
        $piece.setAttribute('data-in', tileToId)
        $piece.style.transition = `top ${duration}ms linear, left ${duration}ms linear`

        // console.log(tileFromId, tileToId)
        // debugger // remove this to make the application stop working
        // tileFromId and tileToId are switched whenever the debugger is removed so that probably means there is an issue with async code
        // but i need to examine the whole process to know more
        // the process cannot be examined because the presence of the breakpoint makes the application work (whoever invented this bullshit is retarded as fuck)
        return new Promise(r => {
            setTimeout(() => {
                $piece.style.transition = ''
                $piece.style.boxShadow = ''
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
    constructor(width, height = null, initialState = null, goalState = null) {
        super(width, height)

        // does this need to be here or can be in draw?
        this.setupGrid(width, height, initialState, goalState)

        // for (let i = 1; i < this.grid.length; i++)
        //     this.addPiece(i)

        // this.addPiece(2)
        // this.goalState = this.getState()

        // if (this.width == 3 && this.height == 3)
        //     this.eightPuzzleStates = this.generate8PuzzleStates()
    }

    setupGrid(width, height, initialState = null, goalState = null) {
        // in order for this to be reusable it needs to first get rid of existing pieces (or move them)
        this.puzzle = new EightPuzzle(width, height, initialState, goalState)
        this.puzzle.initialState.forEach((val, idx) => val !== 0 && this.addPiece(idx, val))
        this.pieceLoop().forEach($piece => this.addClickSwitch($piece))
    }
    
    addClickSwitch($piece) {
        $piece.addEventListener('mousedown', eMouseDown => {
            const start = performance.now()

            const mouseUp = async eMouseUp => {
                // hahahahha
                await new Promise(r => setTimeout(r, 1))
                // console.log(performance.now() - start)

                if (performance.now() - start < 100 && Math.abs(eMouseUp.x - eMouseDown.x) < 5 && Math.abs(eMouseUp.y - eMouseDown.y) < 5) {
                    const result = switchBlankWithTile(this.getState(), this.width, this.height, $piece.tileId)
                    await this.moveFromEndNode(result)
                }

                $piece.removeEventListener('mouseup', mouseUp)
            }

            $piece.addEventListener('mouseup', mouseUp)
        })
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
                    break;
            }
        }

        worker.postMessage(new WorkerMessage(WorkerMessageType.Initialization, new EightPuzzle(this.width, this.height, this.getState())))
        setInterval(worker.postMessage(new WorkerMessage(WorkerMessageType.Polling)), 10)
    }

    getState() {
        return this.grid.map(tile => tile.piece !== null ? tile.piece.pieceId : 0)
        return this.grid.map($tile => $tile.piece?.pieceId ?? 0)
    }

    getTileFromPiece(pieceId) {
        return this.grid.find($tile => $tile.piece?.pieceId === pieceId) ?? null
    }

    // test this
    *getStates(goal) {
        return new EightPuzzle(this.width, this.height, this.getState(), goal).aStarSearch().getPath()
    }

    // seems to be a problem with this?
    moveToNextState(state) {
        for (const $tile of this.grid) {
            const pieceId = state[$tile.tileId]

            if ($tile.piece === null)
                continue

            if ($tile.piece.pieceId === pieceId)
                continue

            // add ismovelegal

            return this.movePiece($tile.tileId, state.indexOf($tile.piece.pieceId))
        }
    }

    async moveToNextStates(states, step) {
        for (const state of states) {
            await this.moveToNextState(state)

            if (step)
                debugger
        }
    }

    async moveFromEndNode(node, step = false) {
        await this.moveToNextStates(node.getPath().map(n => n.state), step)
        
        // return this.moveToNextStates(node.getPath().map(n => n.state))
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

        await this.moveToStateConditionally(this.puzzle.goalState, condition, states)
    }

    setPicture() {
        // here we need to use css to cut up a photo (possibly upload but i will do it with url for now and also it will facilitate the lorep picsum or whatever)
        // would be nice to future proof this so that the photos are picked with the kinda correct ratio
        // but from what i can see going to 3x4 the npuzzle logic does not work anymore and just hangs the browser
        // which is why we should offload the computation to a worker i guess or do it asynchronously
    }

    getCorrectTiles(include0 = false) {
        return this.getState().reduce((correct, piece, tile) => {
            if (piece === 0 && !include0)
                return correct

            if (this.puzzle.goalState[tile] === piece)
                correct.push(tile)

            return correct
        }, [])
    }
}