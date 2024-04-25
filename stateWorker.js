import { EightPuzzle } from "./npuzzle.js"

self.postMessage(await new EightPuzzle(3).generate8PuzzleStates())