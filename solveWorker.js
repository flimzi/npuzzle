import { EightPuzzle } from "./npuzzle.js"

// actually this definetely needs to transfer the ownership so we need to change the program to use Int16Array instead of [] (if possible)
// because changing it to a typed array after the fact is completely useless in terms of performance but it aims to show to point of the operation
self.postStates = node => self.postMessage(node.getStates())

self.onmessage = async ({ data: { stream, width, height, initialState, goalState } }) => {
    const puzzle = new EightPuzzle(width, height, initialState, goalState)
    // const path = puzzle.solveWithStates().getStates().map(s => new Int16Array(s))
    // debugger
    // // chunk size should depend on the size of individual state but whatever
    // const chunkSize = 100
    // for (let i = 0; i < path.length; i += chunkSize)
    //     self.postMessage(path.slice(i, i + chunkSize))

    // debugger
    // self.postMessage(true)

    // self.postMessage(path, path.map(x => x.buffer))
    if (!stream)
        return self.postStates(puzzle.solveWithStates())

    // this cannot return the nodes themselves because the stack gets destroyed
    // maybe try returning int16array from getStates()
    await puzzle.trySolve().map(self.postStates).consume()
    self.postMessage(null)
}