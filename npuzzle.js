
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
    }

    // not sure how to write this not-static because im retarded and dont want shit to break rn
    // also probably not a good idea with the array spread
    static path(node) {
        if (node === null)
            return []

        return [...Node.path(node.parentNode), node]
    }

    getPath() {
        return Node.path(this)
    }

    toString() {
        return '<' + this.state.toString() + '>'
    }
}

export class EightPuzzle {
    constructor(width, height = null, initialState = null, goalState = null) {
        this.width = width
        this.height = height || width
        this.initialState = initialState || EightPuzzle.generateValidPuzzleState(this.width, this.height)
        this.goalState = goalState || EightPuzzle.generateGoalState(this.width, this.height)

        this.diagnostics = {
            manhattanTotal: 0,
            manhattanTime: 0,
            manhattanAvarageTime: 0
        }
    }

    isGoal(state) {
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

        return adjacent.toSorted()
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
        debugger
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
                console.log('index: ', i * this.width + j, 'value: ', state[i * this.width + j], 'distance:', Math.abs(i - goalI) + Math.abs(j - goalJ))
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

    generate15PuzzleFringeStates() {
        const queue = [this.goalState]
        const states = {[this.goalState.toString()]: 0}
        let counter = 0

        while (queue.length) {
            const state = queue.shift()
            const distance = states[state.toString()]

            for (const action of this.actions(state)) {
                const nextState = this.result(state, action)

                if (!haveElementsChangedPlace(state, nextState))
                    continue

                if (nextState.toString() in states)
                    continue
            
                states[nextState.toString()] = distance + 1
                    queue.push(nextState)

                if (++counter % 10000 === 0) {
                    console.log(counter)
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
    
    static generateValidPuzzleState(width, height = null) {
        let state = EightPuzzle.generateGoalState(width, height)
    
        do {
            shuffleArray(state)
        } while (!isSolvable(state))
    
        return state
    }
}

// const e1 = new EightPuzzle(3, 3, [1, 4, 2, 0, 7, 5, 3, 6, 8], [0, 1, 2, 3, 4, 5, 6, 7, 8])
// const e1 = new EightPuzzle(3, 3, generateValid8PuzzleState(), [0, 1, 2, 3, 4, 5, 6, 7, 8])

// for (const node of e1.aStarSearch().getPath()) {
//     console.log(e1.print(node.state))
// }

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

function haveElementsChangedPlace(array1, array2, positions) {
    return array1.every((item, index) => !positions.includes(index) || item === array2[index])
}