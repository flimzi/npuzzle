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

export function coordinateToDirection({ x, y }) {
    if (Math.abs(x) > Math.abs(y))
        return x > 0 ? Direction.Right : Direction.Left
    else
        return y > 0 ? Direction.Down : Direction.Up
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
export function add({x, y}, val) {
    return xy(x + val, y + val)
}

export function offset(xy1, xy2) {
    return xy(xy1.x + xy2.x, xy1.y + xy2.y)
}

export function scale({ x, y }, multiplier) {
    return xy(x * multiplier, y * multiplier)
}

export function floor({ x, y }) {
    return xy(Math.floor(x), Math.floor(y))
}

export function getDifference(xy1, xy2) {
    return xy(xy1.x - xy2.x, xy1.y - xy2.y)
}

export function getDistance(xy1, xy2) {
    return Math.sqrt(Math.pow(xy2.x - xy1.x, 2) + Math.pow(xy2.y - xy1.y, 2));
}

// only works for square grids now!!!!!
// export function getCoordinates(height, index) {
//     // return {
//     //     x: index % height,
//     //     y: Math.floor(index / height)
//     // }

//     return xy(index % height, Math.floor(index / height))
// }

export function getCoordinates(width, index) {
    return xy(index % width, Math.floor(index / width))
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

export function print2dStates(states, width, height = null) {
    states.map(state => print2dState(state, width, height))
}

export function getNode(nodeOrState) {
    if (nodeOrState instanceof Node)
        return nodeOrState
    
    if (Array.isArray(nodeOrState))
        return new Node(nodeOrState)

    return new Node(Array.from(nodeOrState))
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
    return range(Math.max(0, this.length - 1)).map(idx => [this[idx], this[idx + 1]])
}

Array.prototype.compare = function(other) {
    return JSON.stringify(this) === JSON.stringify(other)
}

Array.range = function(size) {
    return range(size)
}

Array.prepend = function(other) {
    return other.concat(this)
}

Number.prototype.range = function() {
    return range(this)
}

Array.prototype.toShuffled = function() {
    const array = this.slice()
    
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array
}

// Array.prototype.toGenerator = function*() {
//     for (const item of this)
//         yield item
// }

Array.prototype.toIterator = function() {
    return Iterator.from(this)
}

// export function *take(generator, count = 1) {
//     for (const idx of Array.range(Math.abs(count))) {
//         if (generator.done)
//             return

//         yield generator.next().value
//     }
// }

// export function *skip(generator, count = 1) {
//     take(generator, count - 1)
//     const {done, value} = generator.next()
//     return !done && value
// }

// Iterator.prototype.consume = function(count = 1) {

// }

// Iterator.prototype.skip = function(count = 1) {

//     this.take(count - 1)
//     const { done, value } = this.next()
//     return !done && value
// }

// this should be a generator because stack overflow
export function range(length) {
    return Array(length).keys().toArray()
}

export function getAdjacent(width, height, index) {
    const {x, y} = getCoordinates(width, index)
    const adjacent = []

    if (x > 0)
        adjacent.push(index - 1)

    if (x < width - 1)
        adjacent.push(index + 1)

    if (y > 0)
        adjacent.push(index - width)

    if (y < height - 1)
        adjacent.push(index + width)

    return adjacent
}

export function getAdjacentWithDirections(width, height, index) {
    const { x, y } = getCoordinates(width, index)
    const adjacent = []

    if (x > 0)
        adjacent.push([Direction.Left, index - 1])

    if (x < width - 1)
        adjacent.push([Direction.Right, index + 1])

    if (y > 0)
        adjacent.push([Direction.Up, index - width])

    if (y < height - 1)
        adjacent.push([Direction.Down, index + width])

    return adjacent
}

export function getNeighbors(width, height, tileId) {
    const tileXY = getCoordinates(width, tileId)
    const offsetsToIndexes = offsets => offsets.map(off => offset(tileXY, off))
                                               .filter(({x, y}) => x >= 0 && y >= 0 && x < width && y < height)
                                               .map(({x,y}) => getIndex(x, y, width))

    const neighbors = {
        adjacent: offsetsToIndexes([ xy(0, -1), xy(-1, 0), xy(0, 1), xy(1, 0) ]),
        diagonal: offsetsToIndexes([ xy(-1, -1), xy(-1, 1), xy(1, 1), xy(1, -1) ])
    }

    return { ...neighbors, all: neighbors.adjacent.zip(neighbors.diagonal).flat().filter(x => x !== undefined) }
}

ImageData.prototype.shouldTextBeWhite = function() {
    let totalBrightness = 0

    for (let i = 0; i < this.data.length; i += 4) {
        // Get the RGB values
        const r = this.data[i]
        const g = this.data[i + 1]
        const b = this.data[i + 2]

        // Calculate brightness using the luminance formula
        const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        totalBrightness += brightness
    }

    const averageBrightness = totalBrightness / (this.width * this.height)

    // Choose text color based on average brightness
    return averageBrightness < 128
}

export function toPx(size) {
    return size + 'px'
}

Object.prototype.toPx = function() {
    return toPx(this)
}

export class Rectangle {
    constructor(width = 0, height = 0, top = 0, left = 0) {
        this.width = width
        this.height = height
        this.top = top
        this.left = left
    }

    apply($element) {
        $element.style.width = this.width.toPx()
        $element.style.height = this.height.toPx()
        $element.style.top = this.top.toPx()
        $element.style.left = this.left.toPx()
    }
}

export const AsyncIteratorPrototype = Object.getPrototypeOf(
    Object.getPrototypeOf(Object.getPrototypeOf((async function* () {})())),
);

AsyncIteratorPrototype.drop = async function(count = 1) {
    for (let i = 0; i++ < count;)
        await this.next() // not sure if this works?

    // this is so we dont need two awaits if we want to retrieve the value from generator but i might need to rethink this
    return this.next()
}

AsyncIteratorPrototype.map = async function*(callbackfn) {
    for await (const value of this)
        yield callbackfn(value)
}

AsyncIteratorPrototype.consume = async function() {
    for await (const _ of this)
        continue
}