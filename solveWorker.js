import { EightPuzzle } from "./npuzzle.js"

// actually this definetely needs to transfer the ownership so we need to change the program to use Int16Array instead of [] (if possible)
// because changing it to a typed array after the fact is completely useless in terms of performance but it aims to show to point of the operation
self.onmessage = async ({ data }) => {
    const puzzle = new EightPuzzle(data.width, data.height, data.initialState, data.goalState)
    // const path = puzzle.solveWithStates().getStates().map(s => new Int16Array(s))
    // debugger
    // // chunk size should depend on the size of individual state but whatever
    // const chunkSize = 100
    // for (let i = 0; i < path.length; i += chunkSize)
    //     self.postMessage(path.slice(i, i + chunkSize))

    // debugger
    // self.postMessage(true)

    // self.postMessage(path, path.map(x => x.buffer))
    self.postMessage(puzzle.solveWithStates().getStates())
}