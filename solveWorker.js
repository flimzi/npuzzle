import { EightPuzzle } from "./npuzzle.js"

// i feel like we maybe need to partition the result because it doesnt fit on the stack?
// also consider supporting iterator based solution
self.onmessage = async ({ data }) => {
    // const puzzle = new EightPuzzle(data.width, data.height, data.initialState, data.goalState)
    // const path = puzzle.solveWithStates().getPath()
    // debugger
    // // chunk size should depend on the size of individual state but whatever
    // const chunkSize = 100
    // for (let i = 0; i < path.length; i += chunkSize)
    //     self.postMessage(path.slice(i, i + chunkSize))

    // debugger
    // self.postMessage(true)

    // self.postMessage(x, [x])
}