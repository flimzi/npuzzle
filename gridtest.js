import * as util from './interface.js'

const rows = 5
const columns = 3
const pieceRatio = .9
const goalState = util.range(rows * columns).toShiftedLeft()
const pieces = []

function createTile(id) {
    const $tile = document.createElement('div')
    $tile.tileId = id
    $tile.style.position = 'absolute'
    $tile.style.transform = 'translate(-50%, -50%)'
    $tile.setAttribute('data-tile', $tile.tileId)
    $tile.$piece = null

    // $tile.innerText = id
    return $tile
}

function getState() {
    return grid.map($tile => $tile.$piece?.pieceId ?? 0)
}

function actions(index) {
    const blankX = index % columns
    const blankY = Math.floor(index / columns)
    const adjacent = []

    if (blankX > 0)
        adjacent.push(index - 1)

    if (blankX < columns - 1)
        adjacent.push(index + 1)

    if (blankY > 0)
        adjacent.push(index - columns)

    if (blankY < rows - 1)
        adjacent.push(index + columns)

    return adjacent
}

function emptyActions(state) {
    return actions(state).filter(action => grid[action].$piece === null)
}

function clickMove($piece, startXY, endXY) {
    if (util.getDistance(startXY, endXY) > $piece.clientWidth / 4)
        return false

    const blankIndex = emptyActions($piece.$tile.tileId)[0]
    if (blankIndex === undefined)
        return false

    assignPieceToTile($piece, grid[blankIndex])
    return true
}

function swipeMove($piece, startXY, endXY) {
    const direction = util.coordinateToDirection(util.getDifference(endXY, startXY))
    const indexXY = util.offset(util.getCoordinates(columns, $piece.$tile.tileId), util.directionToCoordinates(direction))
    const index = util.getIndex(indexXY.x, indexXY.y, columns)

    if (grid[index]?.$piece !== null)
        return false

    assignPieceToTile($piece, grid[index])
    return true
}

function addPieceEvents($piece) {
    $piece.addEventListener('mousedown', eMouseDown => {
        eMouseDown.preventDefault()

        window.addEventListener('mouseup', eMouseUp => {
            clickMove($piece, eMouseDown, eMouseUp) || swipeMove($piece, eMouseDown, eMouseUp)
        }, { once: true })
    })

    $piece.addEventListener('touchstart', eTouchStart => {
        const startXY = util.xy(eTouchStart.changedTouches[0].screenX, eTouchStart.changedTouches[0].screenY)

        window.addEventListener('touchend', eTouchEnd => {
            const endXY = util.xy(eTouchEnd.changedTouches[0].screenX, eTouchEnd.changedTouches[0].screenY)
            clickMove($piece, startXY, endXY) || swipeMove($piece, startXY, endXY)
        }, { once: true })
    })
}

function createPiece(id) {
    const $piece = document.createElement('div')
    $piece.pieceId = id
    $piece.style.position = 'absolute'
    $piece.style.transform = 'translate(-50%, -50%)'
    $piece.setAttribute('data-piece', $piece.pieceId)
    addPieceEvents($piece)

    $piece.innerText = id
    pieces.push($piece)
    return $piece
}

function assignPieceToTile($piece, $tile) {
    if ($piece.$tile !== undefined)
        $piece.$tile.$piece = null

    $tile.$piece = $piece
    $piece.$tile = $tile
    $piece.setAttribute('data-in', $tile.tileId)

    $piece.style.left = $tile.offsetLeft + 'px'
    $piece.style.top = $tile.offsetTop + 'px'
    $piece.style.width = $tile.clientWidth * pieceRatio + 'px'
    $piece.style.height = $tile.clientHeight * pieceRatio + 'px'
}

const grid = util.range(rows * columns).map(createTile)
const $container = document.querySelector('.container')
const $grid = document.createElement('div')
$grid.classList.add('grid')

function assignOrAddPieceToTile(pieceId, $tile) {
    assignPieceToTile(pieces.find($piece => $piece.pieceId === pieceId) ?? $grid.appendChild(createPiece(pieceId)), $tile)
}

const picWidth = Math.min(1000, columns * 100)
const picHeight = Math.min(1000, rows * 100)
const imageUrl = fetch(`https://picsum.photos/${picWidth}/${picHeight}`).then(async r => URL.createObjectURL(await r.blob()))

for (const $tile of grid) {
    $grid.appendChild($tile)
}

function setState(state) {
    state.forEach((pieceId, tileId) => pieceId !== 0 && assignOrAddPieceToTile(pieceId, grid[tileId]))
}

function getScaledPicture(width, height, urlObj) {
    const image = new Image()
    image.src = urlObj

    return new Promise(resolve => {
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width
            canvas.height = height
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/png'))
        }
    })
}

$grid.addEventListener('mousemove', e => e.preventDefault())
$grid.addEventListener('touchstart', e => e.preventDefault())

const containerObserver = new ResizeObserver(entries => {
    const containerRect = $container.getBoundingClientRect()
    const tileSize = Math.floor(Math.min(containerRect.height / rows, containerRect.width / columns))
    const gridWidth = tileSize * columns
    const gridHeight = tileSize * rows

    $grid.style.width = gridWidth + 'px'
    $grid.style.height = gridHeight + 'px'
    const scaledImg = imageUrl.then(urlObj => getScaledPicture(gridWidth, gridHeight, urlObj))

    for (const $tile of grid) {
        const { x, y } = util.getCoordinates(columns, $tile.tileId)
        $tile.style.width = $tile.style.height = tileSize + 'px'
        $tile.style.left = x * tileSize + tileSize / 2 + 'px'
        $tile.style.top = y * tileSize + tileSize / 2 + 'px'

        if ($tile.$piece !== null) {
            assignPieceToTile($tile.$piece, $tile)

            scaledImg.then(url => {
                const { x, y } = util.getCoordinates(columns, goalState.indexOf($tile.$piece.pieceId))
                const pieceOffset = tileSize * (1 - pieceRatio)
                $tile.$piece.style.backgroundImage = `url(${url})`
                $tile.$piece.style.backgroundPosition = `-${x * tileSize + pieceOffset}px -${y * tileSize + pieceOffset}px`
            })
        }
    }
})

util.range(1).forEach(_ => setState(goalState))
$container.appendChild($grid)
containerObserver.observe($container)

window.grid = {
    rows, columns, tileRatio: pieceRatio, goalState, grid, pieces,
    getState, actions, emptyActions, setState
}