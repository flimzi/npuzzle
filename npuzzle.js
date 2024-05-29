import * as iface from "./interface.js";
import { moveBlank, moveTileRaw } from "./manualsolver.js";

class PriorityQueue {
    constructor(initialValues, comparator) {
        this.queue = initialValues || [];
        this.comparator = comparator || ((a, b) => a - b);
        this.queue.sort(this.comparator);
    }

    add(element) {
        this.queue.push(element);
        this.queue.sort(this.comparator);
    }

    pop() {
        return this.queue.shift();
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

export class Node {
    constructor(state, parentNode = null, indexToSwapWith0 = null, pathCost = null) {
        this.state = state
        this.parentNode = parentNode
        this.indexToSwapWith0 = indexToSwapWith0
        this.pathCost = pathCost
        this.depth = 0
        this.blankIndex = state.indexOf(0)
    }

    // not sure how to write this not-static because im retarded and dont want shit to break rn
    // also probably not a good idea with the array spread (maybe concat?)
    static path(node) {
        if (node === null)
            return []

        return [...Node.path(node.parentNode), node]
    }

    getPath() {
        return Node.path(this)
    }

    printState(width, height = null) {
        iface.print2dState(this.state, width, height)
    }

    printPath(width, height = null) {
        this.getPath().forEach(node => node.printState(width, height))
    }

    toString() {
        return '<' + this.state.toString() + '>'
    }

    static fromNodeOrState(nodeOrState) {
        return iface.getNode(nodeOrState)
    }

    getStates() {
        return this.getPath().map(n => n.state)
    }
}

export class EightPuzzle {
    constructor(width, height = null, initialState = null, goalState = null) {
        this.width = width
        this.height = height ?? width
        this.goalState = goalState ?? EightPuzzle.generateGoalStateEndBlank(this.width, this.height)
        this.initialState = initialState ?? this.goalState
    }

    // methods below should be in Node

    isGoal(state = this.initialState) {
        // return state === this.goalState // WTF
        return JSON.stringify(state) === JSON.stringify(this.goalState) // omg
    }

    actions(state) {
        const blankIndex = state.indexOf(0)
        const blankX = blankIndex % this.width
        const blankY = Math.floor(blankIndex / this.width)
        const adjacent = []

        if (blankX > 0)
            adjacent.push(blankIndex - 1)

        if (blankX < this.width - 1)
            adjacent.push(blankIndex + 1)

        if (blankY > 0)
            adjacent.push(blankIndex - this.width)

        if (blankY < this.height - 1)
            adjacent.push(blankIndex + this.width)

        return adjacent.toSorted() // not sure why this is here but afraid to remove
    }

    result(state, action) {
        const blankIndex = state.indexOf(0)
        const stateCopy = state.slice()

        const blankTemp = stateCopy[blankIndex];
        stateCopy[blankIndex] = stateCopy[action];
        stateCopy[action] = blankTemp;

        // [stateCopy[action], stateCopy[blankIndex]] = [stateCopy[blankIndex], stateCopy[action]]
        return stateCopy
    }

    // methods above should be in Node

    printGrid() {
        iface.print2dState([...Object.keys(this.initialState)], this.width, this.height)
    }

    static manhattanDistance(stateX, stateY, goalX, goalY) {
        // console.log(Math.abs(stateX - goalX) + Math.abs(stateY - goalY))
        return Math.abs(stateX - goalX) + Math.abs(stateY - goalY)
    }

    static precomputeManhattanDistances(width, height, goalState) {
        const manhattanDistances = []

        // for (let i = 0; i < width * height; i++) {
        //     for (let j = 1; j < width * height; j++)
        //         manhattanDistances[i][j] = EightPuzzle.manhattanDistance(i, j, goalX, goalY) // need to actually find the XY coordinates in grid and goalState for computation
        // }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x
                manhattanDistances[index] = []
                
                for (let value = 1; value < width * height; value++) {
                    const goalIndex = goalState.indexOf(value)
                    const goalX = Math.floor(goalIndex / width)
                    const goalY = goalIndex % width

                    manhattanDistances[index][value] = EightPuzzle.manhattanDistance(x, y, goalX, goalY)
                }
            }
        }

        return manhattanDistances
    }

    // calculateManhattanDistance(node) {
    //     // const startTime = performance.now()
    //     let totalDistance = 0;

    //     for (let i = 0; i < this.height; i++) {
    //         for (let j = 0; j < this.width; j++) {
    //             const value = node.state[i * this.width + j];

    //             if (value === 0)
    //                 continue

    //             const goalIndex = this.goalState.indexOf(value);
    //             const goalI = Math.floor(goalIndex / this.width);
    //             const goalJ = goalIndex % this.width;
    //             totalDistance += Math.abs(i - goalI) + Math.abs(j - goalJ);
    //             console.log('index: ', i * this.width + j, 'value: ', node.state[i * this.width + j], 'distance:', Math.abs(i - goalI) + Math.abs(j - goalJ))
    //         }
    //     }

    //     // const elapsed = performance.now() - startTime
    //     // this.diagnostics.manhattanTotal++
    //     // this.diagnostics.manhattanTime += elapsed
    //     // this.diagnostics.manhattanAvarageTime = this.diagnostics.manhattanTime / this.diagnostics.manhattanTotal

    //     return totalDistance;
    // }

    calculateManhattanDistance(state) {
        // const startTime = performance.now() 
        let totalDistance = 0;

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const value = state[i * this.width + j];

                if (value === 0)
                    continue

                const goalIndex = this.goalState.indexOf(value);
                const goalI = Math.floor(goalIndex / this.width);
                const goalJ = goalIndex % this.width;
                totalDistance += Math.abs(i - goalI) + Math.abs(j - goalJ);
                // console.log('index: ', i * this.width + j, 'value: ', state[i * this.width + j], 'distance:', Math.abs(i - goalI) + Math.abs(j - goalJ))
            }
        }

        // const elapsed = performance.now() - startTime
        // this.diagnostics.manhattanTotal++
        // this.diagnostics.manhattanTime += elapsed
        // this.diagnostics.manhattanAvarageTime = this.diagnostics.manhattanTime / this.diagnostics.manhattanTotal

        return totalDistance;
    }

    static *tileLoop(width, height, state) {
        for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++)
                yield { x, y, idx: y * width + x, val: state[y * width + x] }
    }

    *tileLoop(state = null) {
        yield* EightPuzzle.tileLoop(this.width, this.height, state || this.state)
    }

    inversions(board) {
        let count = 0
    
        for (let i = 0; i < board.length - 1; i++)
            for (let j = i + 1; j < board.length; j++)
                if (board[i] > board[j] && board[i] != 0 && board[j] != 0)
                    count++
    
        return count
    }

    actionCost() {
        return 1
    }

    *expandNode(node) {
        // const state = node.state

        for (const action of this.actions(node.state)) {
            const resultingState = this.result(node.state, action)
            const cost = node.pathCost + this.actionCost()
            yield new Node(resultingState, node, action, cost)
        }
    }

    bestFirstSearch(f) {
        let node = new Node(this.initialState)
        const frontier = new PriorityQueue([node], (a, b) => f(a) - f(b))
        const reached = {[this.initialState]: node}

        while (!frontier.isEmpty()) {
            node = frontier.pop()

            if (this.isGoal(node.state))
                return node
            
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

    searchMoveBlankTo(nodeOrState, tileId, avoid = []) {
        const tile = iface.getCoordinates(this.width, tileId)

        const h = node => {
            const blank = iface.getCoordinates(this.width, node.state.indexOf(0))
            return EightPuzzle.manhattanDistance(blank.x, blank.y, tile.x, tile.y) // + node.pathCost ?
        }

        let node = iface.getNode(nodeOrState)
        const frontier = new PriorityQueue([node], (a, b) => h(a) - h(b))
        const reached = {[node.state]: node}
        let branched = 0

        while (!frontier.isEmpty()) {
            node = frontier.pop()

            if (node.state.indexOf(0) === tileId)
                return node
            
            for (let child of this.expandNode(node)) {
                if (++branched > 250)
                    return null

                if (avoid.includes(child.indexToSwapWith0))
                    continue

                let s = child.state
                
                if (!(s in reached) || child.pathCost < reached[s].pathCost) {
                    reached[s] = child
                    frontier.add(child)
                }
            }
        }

        return null
    }

    getBlankPositions(tileId, distance, direction) {
        const positions = []
        let xy = iface.getCoordinates(this.width, tileId)

        for (let moved = 0; moved < distance; moved++) {
            const move = iface.getAdjacentWithDirections(this.width, this.width, iface.getIndex(xy.x, xy.y, this.width)).find(([dir]) => dir === direction)

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

    movePieceManually(nodeOrState, tileId, distance, direction, avoid = []) {
        let node = iface.getNode(nodeOrState)
        const pieceId = node.state[tileId] // ??

        // for some reason i cannot make this work so that the first travel can move through the piece and doesnt need to avoid it
        // i would need to write this differently if i wanted that to work because the distance is always only 1 here
        // and i think it could have an impact on the ability of this code to solve the puzzle
        // console.log(distance)
        for (const id of this.getBlankPositions(tileId, distance, direction)) {
            const resultNode = this.searchMoveBlankTo(node, id, [...avoid, node.state.indexOf(pieceId)])

            if (resultNode === null)
                return null

            node = moveBlank(resultNode, this.width, this.height, iface.oppositeDirection(direction))
            // IMPORTANT CHANGE
            node.pathCost = resultNode.pathCost + 1
        }

        return node
    }

    searchMovePieceTo(nodeOrState, pieceId, tileTo, avoid = []) {
        const goal = iface.getCoordinates(this.width, tileTo)

        const h = node => {
            const tile = iface.getCoordinates(this.width, node.state.indexOf(pieceId))
            return EightPuzzle.manhattanDistance(goal.x, goal.y, tile.x, tile.y) // + node.pathCost ?
        }

        const expand = node => Object.values(iface.Direction)
                                     .map(dir => this.movePieceManually(node, node.state.indexOf(pieceId), 1, dir, avoid))
                                     .filter(n => n !== null)

        let node = iface.getNode(nodeOrState)
        const frontier = new PriorityQueue([node], (a, b) => h(a) - h(b))
        const reached = {[node.state]: node}
        let branched = 0

        while (!frontier.isEmpty()) {
            // console.log([...frontier.queue])
            // console.log('expand')
            node = frontier.pop()

            if (node.state.indexOf(pieceId) === tileTo)
                return node

            // debugger
            for (let child of expand(node)) {
                if (++branched > 50) // not sure about the limit here
                    return null

                let s = child.state
                
                if (!(s in reached) || child.pathCost < reached[s].pathCost) {
                    reached[s] = child
                    frontier.add(child)

                    // iface.print2dState(child.state, this.width, this.height)
                    // console.log('= ' + h(child))
                }
            }
        }

        return null
    }

    // how are we going to know when do we need this? for corner tiles we know which ones they are but i guess for others after a search failure we can try running this
    // i guess take the piece you want to move into what tile on the perimeter of the "circle" and maybe the direction of the rotation?
    // or i guess this should just be one unit of rotation but we also need the setup stage where we get the blank next to the piece
    // which then leans into doing the whole process in this method 
    // how do we do that doe
    // i guess first we need to move the blank next to the piece but that can be done outside of this method becuase it invloves tiles to avoid
    // based on blank tile position, rotate either up or down (where applicable) until a given state is achieved or null if rotated fully but not machtched goal?
    // this would i think be the easiest way to do this and further abstractions could then be devised on top
    // we could have a class that represents a rotation and then we could step by step return states because we would know at which point in the rotation we are

    // works as a proof of concept but the final version needs to be able to rotate without setup and outro
    // also will need to switch to a tile other than from avoid
    // which basically means we need to know when to eject the consumed tileId (this probably needs to be a class to hold state)
    rotateBlank(nodeOrState, tileId, backwards = false, avoid = []) {
        let node = Node.fromNodeOrState(nodeOrState)
        const { adjacent, all } = iface.getNeighbors(this.width, this.height, node.blankIndex)
        
        if (all.length !== 8 || !adjacent.includes(tileId))
            return null

        // check how many moves required to switch blank with tileFrom (it needs to be adjacent)
        // this has to be outside this method so that you can freely rotate back and forth without setup
        node = moveTileRaw(node, this.width, this.height, blankTile, tileId)

        if (node === null /*|| [...switchToTile.getPath()].length !== 2 */)
            return null

        // kinda lazy with this and in-place reverse but whatever
        all.unshift(...all.splice(all.indexOf(node.blankIndex + 1)))
        
        // weird
        if (backwards) {
            all.reverse()
            all.push(all.shift())
        }

        //also lazy
        for (const idx of all)
            node = moveTileRaw(node, this.width, this.height, node.blankIndex, idx)

        return moveTileRaw(node, this.width, this.height, tileId, blankTile)
    }

    get2D(nodeOrState) {
        const node = Node.fromNodeOrState(nodeOrState)
        return iface.range(this.height).map(row => row * this.width).map(start => node.state.slice(start, start + this.width))
    }

    isSquare() {
        return this.width === this.height
    }

    // only works for square
    getLayers(state = this.goalState) {
        const state2d = this.get2D(state.map((piece, tile) => [tile, piece]))        
        return iface.range(this.width - 1).map(layer => state2d[layer].slice(layer).concat(state2d.slice(layer + 1).map(row => row[layer])))
    }

    // return the extra rows or columns first and then return the layers of a remaining square grid
    getComponents(state = this.goalState) {
        let components = []
        const state2d = this.get2D(state.map((piece, tile) => [tile, piece]))
        const diff = this.width - this.height
        const squareDimension = Math.min(this.width, this.height)

        if (diff < 0)
            components = state2d.splice(0, Math.abs(diff))
        else if (diff > 0)
            components = Math.abs(diff).range().map(col => state2d.map(row => row.splice(0, 1).flat()))

        const layers = Array.range(squareDimension - 1).map(layer => state2d[layer].slice(layer).concat(state2d.slice(layer + 1).map(row => row[layer])))
        return components.concat(layers) 
    }

    getCorrectTiles(nodeOrState = this.initialState) {
        const node = Node.fromNodeOrState(nodeOrState)
        return Object.keys(this.goalState).map(Number).filter(tile => this.goalState[tile] === node.state[tile])
    }

    getCorrectTilesWithout0(nodeOrState = this.initialState) {
        return this.getCorrectTiles(nodeOrState).filter(tile => nodeOrState[tile] !== 0)
    }

    // this probably will not work for anything other than end blank goal state so no need to pass it down
    *trySolve () {
        debugger

        if (!isSolvable(this.initialState))
            return null
        
        let node = new Node(this.initialState)
        const solvedTiles = []

        // this is kinda repetitive because you can just subtract 1 from pieceId to get tileId but whatever im not changing it
        for (const [tileId, pieceId] of this.getComponents(EightPuzzle.generateGoalStateEndBlank(this.width, this.height)).flat()) {
            if (node.state[tileId] === pieceId) {
                solvedTiles.push(tileId)
                continue
            }

            const move = this.searchMovePieceTo(node.state, pieceId, tileId, solvedTiles) ?? this.findBestRotation(node.state, pieceId, tileId, solvedTiles)

            if (move === null)
                return null

            // enable break on exception in chrome
            if (move.state[tileId] !== pieceId)
                throw new Error('wrong solution')

            // this check could also be done in grid moves (i mean it would be better for it to be there than here)
            if (!this.isNodeLegal(move))
                throw new Error('illegal move')

            solvedTiles.push(tileId)
            yield node = move
        }
    }

    tryGetSolution() {
        let solution = new Node(this.initialState)

        for (const node of this.trySolve()) {
            if (node === null)
                return null    
        
            const path = node.getPath()
            const first = path[1] ?? path[0]
            first.parentNode = solution
            solution = node
        }

        return solution
    }

    // i dont know if this is even reasonable because i think it should be in a worker and the polling could be done using postmessage?
    // but lets first see if it works when returned from a worker (probably not)
    diagnosticBestFirstSearch(f) {
        let node = new Node(this.initialState)
        const frontier = new PriorityQueue([node], (a, b) => f(a) - f(b))
        const reached = {[this.initialState]: node}
        
        function BFSStat() {
            this.node = null
            this.start = performance.now()
            this.dataSize = 2
            this.heuristic = { current: 0, max: 1 }

            this.progress = () => this.heuristic.current / this.heuristic.max
            this.time = () => performance.now() - this.start
        }
        
        const statistics = new BFSStat()

        const result = new Promise(resolve => {
            while (!frontier.isEmpty()) {
                node = frontier.pop()
                statistics.dataSize--
        
                if (this.isGoal(node.state)) {
                    statistics.node = node
                    return resolve(node)
                }
                
                for (let child of this.expandNode(node)) {
                    let s = child.state
                    
                    if (!(s in reached) || child.pathCost < reached[s].pathCost) {
                        // is this right?
                        statistics.heuristic.current = child.pathCost
                        statistics.heuristic.max = Math.max(statistics.heuristic.max, child.pathCost)
                        reached[s] = child
                        frontier.add(child)
                        statistics.dataSize += 2
                    }

                    if (statistics.dataSize % 1000 === 0) {
                        console.log(statistics.progress())
                    }
                }
            }

            return resolve(null)
        })
    
        return { result, statistics }
    }

    diagnosticAStarSearch() {
        return this.diagnosticBestFirstSearch(n => n.pathCost + this.calculateManhattanDistance(n))
    }

    async generate8PuzzleStates() {
        let stateSpaceSize = 181440 // 9!/2
        let queue = [this.goalState]
        let states = {[this.goalState.toString()]: 0}

        return new Promise(r => {
            while (queue.length) {
                let state = queue.shift()
                let distance = states[state.toString()]
        
                for (const action of this.actions(state)) {
                    const nextState = this.result(state, action)
    
                    if (nextState.toString() in states)
                        continue
    
                    states[nextState.toString()] = distance + 1
                    queue.push(nextState)
                }
    
                // seems to work
                // console.log('remaining ', --stateSpaceSize)
    
                // if (stateSpaceSize % 1000 === 0)
                //     console.log(states)
            }

            return r(states)
        })
    }

    iddfs() {
        const states = {[this.goalState.toString()]: 0}
        const node = new Node(this.goalState)
        let result = null

        for (let depthLimit = 0; result === null; depthLimit++) 
            result = this.depthLimitedSearch(node, depthLimit, states)

        return result
    }

    depthLimitedSearch(node, depthLimit, states) {
        const positions = [0, 3, 7, 11, 12, 14, 14, 15]

        if (node.state.toString() === this.initialState.toString())
            return node

        if (node.depth === depthLimit)
            return null

        for (const action of this.actions(node.state)) {
            const nextNode = new Node(this.result(node.state, action))
            nextNode.depth = node.depth + 1

            if (haveElementsChangedPlace(node.state, nextNode.state, positions) && !(nextNode.state.toString() in states)) {
                states[nextNode.state.toString()] = nextNode.depth
            }

            const result = this.depthLimitedSearch(nextNode, depthLimit, states, start)

            if (result !== null)
                return result
        }

        return null
    }

    // this needs to be done using iddfs (although i dont know if thats true because)
    // it might be that iterative deepening search that has to run through the whole space
    // uses the same amount of memory as bfs?
    generate15PuzzleFringeStates() {
        const queue = [this.goalState]
        const states = {[this.goalState.toString()]: 0}
        const positions = [0, 3, 7, 11, 12, 14, 14, 15]
        let counter = 0

        while (queue.length) {
            const state = queue.shift()
            const distance = states[state.toString()]

            for (const action of this.actions(state)) {
                const nextState = this.result(state, action)

                if (!haveElementsChangedPlace(state, nextState, positions))
                    continue

                if (nextState.toString() in states)
                    continue
            
                states[nextState.toString()] = distance + 1
                    queue.push(nextState)

                if (++counter % 100000 === 0) {
                    // console.log(counter)
                    debugger
                }
            }

            // fricking hell i still dont know how to generate a pattern
            // why does this have to be this difficult
            // but i think maybe if we had the pattern [0, x, x, 3, x, x, x, 7, x, x, x, 11, 12, 13, 14, 15]
            // we could go through all the possible states and only record the distances for states different than this one
            // so for example if 3 was in a different spot, we would save it and its associated distance from the goal
            // but how are we then going to use that information during search? maybe we should first try if this is even possible to do
            // meaning solving the puzzle patrially, using manhattan distance

            // from the korf paper i assume this might be possible because a lot of the times the tiles in the pattern will 
            // repeat in the breadth first search and then we will not save them, but we will still be able to always use them
            // during the actual search
            // im just not sure if using this will result in solving the fringe part first but we will have to find that out ourselves
            // also we know which tiles will end up in the 3x3 so we can even precompute the moves without mapping

            // 1. do bfs from goal states until frontier empty, keeping track of distance with every another move
            // 2. whenever pieces from the fringe pattern appear in a different configuration in a state, save that state and the corresponding distance
            // 3. wait for a long time until this process finishes
        }
    }

    async serve8PuzzleStates(filename = '8puzzleStateSpace.json') {
        const blob = new Blob([JSON.stringify(await this.generate8PuzzleStates())], { type: 'application/json' })
        const $a = document.createElement('a')
        
        $a.href = URL.createObjectURL(blob)
        $a.download = filename

        document.body.appendChild($a)
        $a.click()
        URL.revokeObjectURL($a.href)
        document.body.removeChild($a)
    }

    aStarSearch() {
        return this.bestFirstSearch(n => n.pathCost + this.calculateManhattanDistance(n))
    }

    aStarSearchPrecomputed(goalState = null) {
        const manhattans = EightPuzzle.precomputeManhattanDistances(this.width, this.height, goalState || this.goalState)
        const findForState = state => [...this.tileLoop(state)].reduce((acc, {idx, val}) => acc + manhattans[idx][val])

        return this.bestFirstSearch(n => n.pathCost + findForState(n.state))
    }

    // async pattern8puzzleSearch(states) {
    //     const states = await this.generate8PuzzleStates()
    //     return this.bestFirstSearch(n => states[n.state])
    // }

    print(state) {
        let str = ''

        for (let row = 0; row < this.height; row++) {
            const start = row * this.width
            str += state.slice(start, start + this.width).join(' ') + '\n'
        }

        return str
    }

    static generateGoalState(width, height = null) {
        return [...Array(width * (height || width)).keys()]
    }

    static generateGoalStateEndBlank(width, height = null) {
        const goalState = this.generateGoalState(width, height)
        goalState.push(goalState.shift())
        return goalState
    }
    
    // isSolvable does not work for end blank and gpt is spewing bullshit im too tired for so we have to go for the hardcore approach
    // actually trysolve sometimes fucks up even with the hardcore shuffle so this still has a chance to work
    // however im pretty sure that the issolvable is different depending on whether the blank is first or last (see window.isSolvable2)
    // we should also make it so that the tile starts moving only after the treshold where you can click to switch
    static generateValidPuzzleState(width, height = null) {
        let state = EightPuzzle.generateGoalState(width, height)
    
        do {
            shuffleArray(state)
        } while (!isSolvable(state))
    
        return state
    }

    // *randomMoves(nodeOrState) {
    //     let state = this.initialState.slice()
    //     let previous0

    //     while (true) {
    //         const nextState = this.result(state, this.actions(state).filter(i => i !== previous0).random())
    //         yield nextState
    //         previous0 = state.indexOf(0)
    //         state = nextState
    //     }
    // }

    // generateValidPuzzleStateHardcore(goalState, moves = 1000) {
    //     // return iface.range(cycles).reduce(acc => acc = this.result(acc, this.actions(acc).random()), goalState)

    //     let state = goalState
    //     let previousAction

    //     for (let move = 0; move++ < moves;) {
    //         previousAction = this.actions(state).filter(action => action !== previousAction).random() 
    //         state = this.result(state, previousAction)
    //     }

    //     return state
    // }

    *randomMoves(nodeOrState = this.initialState) {
        let node = Node.fromNodeOrState(nodeOrState)
        let previousAction

        while (true) {
            const action = this.actions(node.state).filter(action => action !== previousAction).random()
            const nextNode = new Node(this.result(node.state, action))
            previousAction = node.blankIndex
            yield node = nextNode
        }
    }

    // todo rewrite this with adjustedNeighbors so that we can have a point of reference for state checking and rewinding
    rotation(nodeOrState, tileFrom, tileTo, avoid = [], backwards = false) {
        const initialNode = Node.fromNodeOrState(nodeOrState)
        const neighbors = iface.getNeighbors(this.width, this.height, initialNode.blankIndex)
        const adjacentTiles = neighbors.all.getAdjacent(neighbors.all.indexOf(tileTo))
        // console.log(neighbors.all)
        // debugger
        // const adjustedNeighbors = neighbors.all.toShiftedLeft(neighbors.all.indexOf(tileFrom))
        // this is just a workaround, we should see if adjustedNeighbors can work (it probably can)
        // next most important thing to implement is i guess working out how to position the piece and blank so that it can be rotated in place
        // maybe for designated corner tiles or as a fallback strategy for failed search
        // not really sure how to do this but i know we should probably check out different rotation directions for fastest
        const adjPrevNext = neighbors.all.indexOf(tileFrom) < neighbors.all.indexOf(tileTo) ? 'next' : 'prev'
        const previousPiece = initialNode.state[adjacentTiles[adjPrevNext]]
        const pieceFrom = initialNode.state[tileFrom]
        const avoidPieces = avoid.map(tile => initialNode.state[tile])

        const rotate = (nodeOrState, backwards) => {
            const node = Node.fromNodeOrState(nodeOrState)
            const path = neighbors.all.toShiftedLeft(neighbors.all.indexOf(node.blankIndex))
            return moveBlank(node, this.width, this.height, path.toShiftedLeft(backwards ? -1 : 1)[0])
        }

        // bullshit
        const unwind = (nodeOrState, limit) => {
            let node = Node.fromNodeOrState(nodeOrState)

            while (node.state[tileTo] !== pieceFrom || !avoid.every(tile => node.state[tile] === initialNode.state[tile])) {
                if (limit-- < 0)
                    return null

                node = rotate(node, !backwards)
            }
                

            return node
        }

        let node = moveBlank(initialNode, this.width, this.height, tileFrom)
        if (node === null || neighbors.all.length !== 8 || !neighbors.all.includes(tileTo))
            return null

        for (const rotation of iface.range(8 * 8)) {
            if (neighbors.adjacent.includes(node.blankIndex)) {
                const adjacentTilesBlank = neighbors.all.getAdjacent(neighbors.all.indexOf(node.blankIndex))

                if (node.state[adjacentTilesBlank[adjPrevNext]] === previousPiece) {
                    node = moveBlank(node, this.width, this.height, initialNode.blankIndex)

                    const avoidTiles = avoidPieces.concat(pieceFrom).map(piece => node.state.indexOf(piece))
                    const possibleTiles = neighbors.adjacent.filter(tile => !avoidTiles.includes(tile))
            
                    if (possibleTiles.length) {
                        node = moveBlank(node, this.width, this.height, possibleTiles.random())
                        // i knew that shit was a problem and it turns out it overshoots so its not right
                        // because it depends on what tile has been injected in the line above
                        // but again it seemed to work so i dont know how tf that happens 
                        // i guess we could rotate until the avoidTiles + targettile have the correct pieces
                        // but im also sure you can calculate this somehow
                        // also this prolly needs to be rewritten
                        // i guess you could also know this by how far the targetpiece is from its targettile this would be how x * 8 to rotate it back
                        // but that would require a correctly oriented rotation path which is not a thing now or is but im too dumb
                        // debugger
                        // return iface.range(rotation).reduce((acc, _) => acc = rotate(acc, !backwards), node)
                        return unwind(node, rotation)
                    }
                }
            }

            node = rotate(node, backwards)
        }

        return null
    }

    // tryRotate(nodeOrState, tileFrom, tileTo, avoid = []) {
    //     const left = this.rotation(nodeOrState, tileFrom, tileTo, avoid)

    //     if (left === null)
    //         return null
        
    //     // perhaps one can be null without the other in that case only the valid needs to be returned but im not sure if that can happen
    //     const right = this.rotation(nodeOrState, tileFrom, tileTo, avoid, true)

    //     return left.getPath().length < right.getPath().length ? left : right
    // }

    // this fails doing the last tile of last layer because a more sophisticated movement is needed and more testing is needed to see if more cases like this exist
    // i can get it to work allright but im pretty sure there is a case where no rotation can suffice but it should be easily fixable but i need a test case that fails
    findBestRotation(nodeOrState, pieceId, tileTo, avoid = []) {
        let node = Node.fromNodeOrState(nodeOrState)
        const possibleRotations = iface.getNeighbors(this.width, this.height, tileTo).all
                                       .zipWith(tile => iface.getNeighbors(this.width, this.height, tile).all)
                                       .filter(([, all]) => all.length === 8)

        // now i guess for all possible rotations move piece on all possible places in neighbors all then move blank to the rotation station
        // then move tryrotate here and take the one with least amount of moves?
        const possibleSetups = []

        for (const [blankTile, neighbors] of possibleRotations) {
            if (avoid.includes(blankTile))
                continue

            for (const targetTile of neighbors) {
                if (avoid.includes(targetTile))
                    continue

                const movePiece = this.searchMovePieceTo(node, pieceId, targetTile, avoid)

                if (movePiece === null)
                    continue

                // should avoid the piece?
                const moveBlank = this.searchMoveBlankTo(movePiece, blankTile, avoid.concat(targetTile))

                if (moveBlank === null)
                    continue

                possibleSetups.push(moveBlank)
            }
        }

        let shortestRotation = [null, Infinity]

        // for some reason the rotation here gets fucked up? even tho it works both ways manually
        for (const node of possibleSetups) {
            const tileFrom = node.state.indexOf(pieceId)
            const left = this.rotation(node, tileFrom, tileTo, avoid)
            // the length checking is kinda lame
            const leftLength = left?.getPath().length ?? Infinity

            if (leftLength < shortestRotation[1])
                shortestRotation = [left, leftLength]

            const right = this.rotation(node, tileFrom, tileTo, avoid, true)
            const rightLength = right?.getPath().length ?? Infinity
            
            if (rightLength < shortestRotation[1])
                shortestRotation = [right, rightLength]
        }

        return shortestRotation[0]
    }

    // run this on the last node in the broken solution
    findBestRotationDebug(nodeOrState, pieceId, tileTo, avoid = []) {
        debugger
        return this.findBestRotation(nodeOrState, pieceId, tileTo, avoid)
    }

    static endBlank(width, height = null, initialState = null) {
        // im not actually sure if generatevalidpuzzlestate is also valid for endblank???? but sigh this is too much
        return new EightPuzzle(width, height, initialState, EightPuzzle.generateGoalStateEndBlank(width, height))
    }

    isMoveLegal(state1, state2) {
        return this.actions(state1).map(action => this.result(state1, action)).some(result => result.compare(state2))
    }

    isNodeLegal(node) {
        return node.getPath().pairwise().map(([cur, next]) => this.isMoveLegal(cur.state, next.state)).every(legal => legal)
    }

    static random(width, height = null, goalState = null) {
        const puzzle = new EightPuzzle(width, height, null, goalState)
        puzzle.initialState = puzzle.randomMoves(puzzle.goalState).drop(1000).next().value.state
        return puzzle
    }

    // this doesnt work as intended so init() needs to be called externally
    // static {
    //     new Promise(resolve => {
    //         const worker = new Worker('./stateWorker.js', { type: 'module' });
    //         worker.onmessage = event => {
    //             EightPuzzle.eightPuzzleStates = event.data
    //             worker.terminate() // without this there are new workers being created constantly but why
    //         }
    //     })

    //     EightPuzzle.solveWorker = new Worker('./solveWorker.js', { type: 'module' })
    // }

    solveFromStates() {
        if (this.width !== 3 || this.height !== 3 || !EightPuzzle.eightPuzzleStates)
            return null

        return this.bestFirstSearch(n => n.pathCost + EightPuzzle.eightPuzzleStates[n.state])
    }

    solveWithStates() {
        return this.solveFromStates() ?? this.tryGetSolution()
    }

    solveWithStatesAsync() {
        return new Promise(resolve => {
            EightPuzzle.solveWorker.addEventListener('message', e => resolve(e.data), { once: true })
            EightPuzzle.solveWorker.postMessage(this)
        })
    }

    static init() {
        const stateWorker = new Worker('./stateWorker.js', { type: 'module' });
        stateWorker.onmessage = event => {
            EightPuzzle.eightPuzzleStates = event.data
            stateWorker.terminate() // without this there are new workers being created constantly but why
        }

        EightPuzzle.solveWorker = new Worker('./solveWorker.js', { type: 'module' })
    }
}

function generateValid8PuzzleState() {
    // Start with the goal state of the 8-puzzle
    const goalState = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 represents the empty space
    
    // Generate a solvable random initial state
    let currentState = shuffleArray(goalState.slice()); // Make a copy and shuffle
    
    // Check if the generated state is solvable, if not, adjust it
    while (!isSolvable(currentState)) {
        currentState = shuffleArray(currentState);
    }
    
    return currentState;
}

// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

// Function to check if a given 8-puzzle state is solvable
function isSolvable(state) {
    let inversionCount = 0;
    const flattenedState = state.slice().filter(num => num !== 0); // Remove the empty space (0)
    
    for (let i = 0; i < flattenedState.length; i++) {
        for (let j = i + 1; j < flattenedState.length; j++) {
            if (flattenedState[i] > flattenedState[j]) {
                inversionCount++;
            }
        }
    }
    
    // Check if the inversion count is even
    return inversionCount % 2 === 0;
}

// window.isSolvable2 = function isSolvable2(state) {
//     const size = Math.sqrt(state.length); // Assuming the puzzle is a square (e.g., 3x3)
//     let inversions = 0;
//     let blankRowFromBottom;

//     // Count inversions
//     for (let i = 0; i < state.length; i++) {
//         for (let j = i + 1; j < state.length; j++) {
//             if (state[i] !== 0 && state[j] !== 0 && state[i] > state[j]) {
//                 inversions++;
//             }
//         }
//     }

//     // Find the row of the blank tile (0), counting from the bottom
//     const blankIndex = state.indexOf(0);
//     const blankRow = Math.floor(blankIndex / size);
//     blankRowFromBottom = size - blankRow;

//     // Determine solvability
//     if (size % 2 !== 0) {
//         // Odd grid size (e.g., 3x3)
//         return inversions % 2 === 0;
//     } else {
//         // Even grid size
//         return (inversions + blankRowFromBottom) % 2 === 0;
//     }
// }

function haveElementsChangedPlace(array1, array2, positions) {
    return !array1.every((item, index) => !positions.includes(index) || item === array2[index])
}

// window.haveElementsChangedPlace = haveElementsChangedPlace

export class Rotation {
    static create(nodeOrState, width, height, tileFrom, tileTo, avoidPieces = []) {
        const self = new Rotation()
        self.width = width
        self.height = height
        self.initialNode = Node.fromNodeOrState(nodeOrState)
        self.currentNode = moveBlank(self.initialNode, self.width, self.height, tileFrom)
        self.neighbors = iface.getNeighbors(width, height, self.initialNode.blankIndex)

        if (self.currentNode === null || self.neighbors.all.length !== 8 || !self.neighbors.all.includes(tileTo))
            return null

        // self.path = self.neighbors.all.toShiftedLeft(self.neighbors.all.indexOf(self.currentNode.blankIndex))
        self.tileFrom = tileFrom
        self.tileTo = tileTo
        self.pieceId = self.initialNode.state[tileFrom]
        self.avoidPieces = avoidPieces

        return self
    }

    rotate(backwards = false) {
        const path = this.neighbors.all.toShiftedLeft(this.neighbors.all.indexOf(this.currentNode.blankIndex)).toShiftedLeft(backwards ? -1 : 1)
        return this.currentNode = moveBlank(this.currentNode, this.width, this.height, path[0])
    }

    rotateFull(rotations = 1, backwards = false) {
        iface.range(rotations * 8).map(() => this.rotate(backwards))
        return this.currentNode
    }

    // also what if we had 2 full rotations before and now need to do it backwards? maybe 1 full and then this...
    rotateUntil(targetTile, pieceId, backwards = false) {
        for (const _ of iface.range(8 * 8)) {
            if (this.currentNode.state[targetTile] === pieceId)
                break

            this.rotate(backwards)
        }

        return this.currentNode
    }

    // this is still low level because there arent many assumptions about the state of the puzzle so it will need to be managed externally
    // i guess it works for the top right corner with 1 rotation but the rest is unknown
    place(tileFrom, tileTo, backwards = false) {
        // from what i can tell doing a whole rotation here ensures that it doesnt matter from where the tilefrom comes from
        // however im not sure about the direction of the rotation yet because for one it could be depending on the situation that the goal can be achieved with fewer
        // steps when the direction is changed
        // so im starting to maybe think that the easiest strategy would be to use rotateuntil here as well and then check which direction has fewer steps?
        // need a way to cancel the rotations though or do it a level higher....
        // this.rotateFull(rotations, backwards)
        
        // this needs to know where to eject the injected tileFrom so that after rewinding the rotation it lands in the correct place
        // im guessing we should get the piece ids of neighboring tiles as well as where the blank is
        // then we would know when the appropriate space is created for the piece to take its correct place
        // the piece ids would be passed down and worked out by the caller
        // the tile id actually would suffice because the caller knows where he wants the piece and this class can work out tile or piece id both directions
        this.rotateUntil()

        this.currentNode = moveBlank(this.currentNode, this.width, this.height, this.initialNode.blankIndex)
        // could definetely be simplifed i think but good enough for now
        const targetTile = this.currentNode.state.indexOf(this.pieceId)
        const avoidTiles = this.avoidPieces.map(p => this.currentNode.state.indexOf(p)).concat(targetTile)
        const possibleTiles = this.neighbors.adjacent.filter(tile => !avoidTiles.includes(tile))

        if (!possibleTiles.length)
            return null

        this.currentNode = moveBlank(this.currentNode, this.width, this.height, possibleTiles.random())
        this.rotateUntil(this.tileTo, this.pieceId, !backwards)

        return this.currentNode
    }

    static testMechanicalSolutions(width, height) {

    }
}