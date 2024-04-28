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

// only works for square grids now
export function getCoordinates(height, index) {
    // also grid movement needs to be examined because now i cannot move anything (this probably has to do with the action meddling)
    // but even without this the movement sometimes blocked itself
    return {
        x: index % height,
        y: Math.floor(index / height)
    }
}

export function oppositeDirection(direction) {
    return {
        [Direction.Left]: Direction.Right,
        [Direction.Right]: Direction.Left,
        [Direction.Up]: Direction.Down,
        [Direction.Down]: Direction.Up,
    }[direction]
}