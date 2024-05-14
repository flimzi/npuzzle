import { Node } from './npuzzle.js'

export const Direction = {
    Right: 'Right',
    Left: 'Left',
    Up: 'Up',
    Down: 'Down'
}

export const Axis = {
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

export const xy = (x, y) => { return { x, y } }

export function coordinateToDirection(x, y) {
    if (x < 0)
        return Direction.Left

    if (x > 0)
        return Direction.Right

    if (y < 0)
        return Direction.Up

    if (y > 0)
        return Direction.Down

    return null
}

export function directionToCoordinates(direction) {
    switch (direction) {
        case Direction.Left:
            return xy(-1, 0)
        case Direction.Right:
            return xy(1, 0)
        case Direction.Up:
            return xy(0, -1)
        case Direction.Down:
            return xy(0, 1)
    }

    return xy(0, 0)
}

// should be in a class obviously
// also this name is wrong because it should be subtraction
export function offset(xy1, xy2) {
    return xy(xy1.x + xy2.x, xy1.y + xy2.y)
}

export function getDistance(xy1, xy2) {
    return Math.sqrt(Math.pow(xy2.x - xy1.x, 2) + Math.pow(xy2.y - xy1.y, 2));
}

// only works for square grids now!!!!! (maybe)
export function getCoordinates(height, index) {
    // return {
    //     x: index % height,
    //     y: Math.floor(index / height)
    // }

    return xy(index % height, Math.floor(index / height))
}

export function getIndex(x, y, width) {
    return y * width + x
}

export function oppositeDirection(direction) {
    return {
        [Direction.Left]: Direction.Right,
        [Direction.Right]: Direction.Left,
        [Direction.Up]: Direction.Down,
        [Direction.Down]: Direction.Up,
    }[direction]
}

export function stateTo2d(state, width, height = null) {
    const grid = []
    height ??= width

    for (let row = 0; row < height; row++) {
        const start = row * width
        grid.push(state.slice(start, start + width))
    }

    return grid
}

export function print2dState(state, width, height = null) {
    const stateFormat = state.map(item => (item + ' ').slice(0, 2))
    stateFormat[stateFormat.indexOf('0 ')] = '%c0 %c'
    console.log(stateTo2d(stateFormat, width, height).join('\n'), 'color: red', 'color: default')
}

export function getNode(nodeOrState) {
    if (nodeOrState instanceof Node)
        return nodeOrState
    
    if (Array.isArray(nodeOrState))
        return new Node(nodeOrState)
}

export const Orientation = { Up: 'Up', Down: 'Down' }

Array.prototype.zip = function(other) {
    return this.map((val, idx) => [val, other[idx]])
}

Array.prototype.zipWith = function(selector) {
    return this.map(val => [val, selector(val)])
}

// could blow up 
Array.prototype.getAdjacent = function(idx) {
    if (!range(this.length).includes(Math.abs(idx)))
        return {}

    return {
        prev: this.at(idx - 1), 
        next: this.at((idx + 1) % this.length)
    }
}

Array.prototype.first = function(modifier, predicate) {
    for (const [idx, val] of this.entries()) {
        const result = modifier(val, idx)

        if (predicate(result))
            return result
    }

    return null
}

Array.prototype.pairwise = function() {
    return iface.range(Math.max(0, this.length - 1)).map(idx => [this[idx], this[idx + 1]])
}

Array.prototype.compare = function(other) {
    return JSON.stringify(this) === JSON.stringify(other)
}

// this should be a generator because stack overflow
export function range(length) {
    return [...Array(length).keys()]
}

export function getNeighbors(width, height, tileId) {
    const tileXY = getCoordinates(height, tileId)
    const offsetsToIndexes = offsets => offsets.map(off => offset(tileXY, off))
                                               .filter(({x, y}) => x >= 0 && y >= 0 && x < height && y < width)
                                               .map(({x,y}) => getIndex(x, y, width))

    // need to reverse the coordinates because its backwards by default
    const neighbors = {
        adjacent: offsetsToIndexes([ xy(0, -1), xy(-1, 0), xy(0, 1), xy(1, 0) ]),
        diagonal: offsetsToIndexes([ xy(-1, -1), xy(-1, 1), xy(1, 1), xy(1, -1) ])
    }

    // im hoping this preserves the order when not every neighbor is available but it seems to do so
    return { ...neighbors, all: neighbors.adjacent.zip(neighbors.diagonal).flat().filter(x => x !== undefined) }
}