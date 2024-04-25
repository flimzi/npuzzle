import { EightPuzzle } from "./npuzzle.js"
import { WorkerMessage, WorkerMessageType } from './grid.js'

// should be on message beacuse eightpuzzle should be passed from caller
// self.postMessage(new WorkerMessage(WorkerMessageType.Result, 10000))

let search = null

self.onmessage = ({data}) => {
    switch (data.type) {
        case WorkerMessageType.Initialization:
            const { width, height, initialState, goalState } = data.value   
            search = new EightPuzzle(width, height, initialState, goalState).aStarSearchPrecomputed()
            search.result.then(n => {
                self.postMessage(new WorkerMessage(WorkerMessageType.Result, n))
                search = null
            })

            break
        case WorkerMessageType.Polling:
            if (search === null)
                return

            self.postMessage(new WorkerMessage(WorkerMessageType.Polling, search.statistics.progress())) // not sure about this but whatever
            break
    }
}

// make it so that the code runs here (we can reuse diagnostic astarsearch by having a then with postmessage)
// also onmessage poll can return back the current progress
// but it would be nice to unify the return value to bfsresult and have progress and 