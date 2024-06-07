import * as util from './interface.js'
import { EightPuzzle, Node } from './npuzzle.js'

export default class Grid {
    // $parent here is non idiomatic, also the order of operations here can have an impact on performance so need to evaluate it
    constructor($parent, rows, columns = null, initialState = null, random = true) {
        this.margin = 0
        this.moveDuration = 500
        this.onChangeState = []
        this.onInit = []
        this.$parent = $parent
        this.rows = rows
        this.columns = columns ?? rows
        this.initialState = initialState ?? Array.range(this.rows * this.columns).toShiftedLeft()
        this.$style = document.body.appendChild(this.createStyle())
        this.$grid = this.createGrid()
        this.setRandomPicture()
        this.resizeObserver = this.getResizeObserver()
        // this.pieceRatio = .98
        this.pieceRatio = 1
        this.showLabels = false
        this.edit = true
        this.tileSize = 0

        if (random)
            this.setRandomState() // i cant make this async because it fucks with the order of other operations (i love programming)
        else
            this.setState(this.initialState)

        $parent.appendChild(this.$grid)
        this.resizeCallback()
        // this.updateCorrectness()
    }

    get blankTile() {
        return this.getState().indexOf(0)
    }

    get $blankTile() {
        return this.grid[this.blankTile]
    }

    createTile(id) {
        const $tile = document.createElement('div')
        $tile.tileId = id
        // $tile.style.position = 'absolute'
        // $tile.style.transform = 'translate(-50%, -50%)'
        $tile.setAttribute('data-tile', $tile.tileId)
        $tile.$piece = null

        return $tile
    }

    createPiece(id) {
        const $piece = document.createElement('div')
        $piece.pieceId = id
        // $piece.style.position = 'absolute'
        // $piece.style.transform = 'translate(-50%, -50%)'
        // $piece.style.cursor = 'grab'
        $piece.setAttribute('data-piece', $piece.pieceId)
        // $piece.style.width = util.toPx(100)
        // $piece.style.height = util.toPx(100)
        $piece.style.transition = `top ${this.moveDuration}ms linear, left ${this.moveDuration}ms linear`
        this.addPieceEvents($piece)
    
        const label = document.createElement('span')
        label.innerText = id
        $piece.appendChild(label)
        return $piece
    }

    assignPieceToTile($piece, $tile) {
        if ($piece.$tile !== undefined)
            $piece.$tile.$piece = null
    
        $tile.$piece = $piece
        $piece.$tile = $tile
        $piece.setAttribute('data-in', $tile.tileId)

        $tile.rect?.apply($piece)
        // $piece.style.left = $tile.offsetLeft + 'px'
        // $piece.style.top = $tile.offsetTop + 'px'

        // // this looks innocent enough but when not needed, i think we should skip this step
        // // also we need to move these declarations to a class because im pretty sure it speeds things up
        // $piece.style.width = $tile.clientWidth * this.pieceRatio + 'px'
        // $piece.style.height = $tile.clientHeight * this.pieceRatio + 'px'
    }

    async moveTileToTile($tileFrom, $tileTo) {
        $tileFrom = $tileFrom instanceof HTMLDivElement ? $tileFrom : this.grid[$tileFrom]
        $tileTo = $tileTo instanceof HTMLDivElement ? $tileTo : this.grid[$tileTo]

        const { $piece } = $tileFrom

        if ($piece === null && $tileFrom.$piece === null)
            throw new Error('empty tiles')
        
        if ($piece === null)
            return this.moveTileToTile($tileTo, $tileFrom)

        this.moving = true
        this.assignPieceToTile($piece, $tileTo)
        await new Promise(r => setTimeout(r, this.moveDuration))

        this.updateCorrectness($piece)
        this.onChangeState.forEach(handler => handler(this))
    }

    movePieceToTile($piece, $tile) {
        return this.moveTileToTile($piece.$tile, $tile)
    }

    movePieceIdToTile($pieceId, $tile) {
        const $tileFrom = this.pieces().find($p => $p.pieceId === $pieceId)?.$tile

        if ($tileFrom === undefined)
            return this.moveTileToTile($tile, this.blankTile)

        return this.movePieceToTile($tileFrom, $tile)
    }

    moveBlankToTile($tile) {
        return this.movePieceIdToTile(0, $tile)
    }

    changeState(nodeOrState) {
        const node = Node.fromNodeOrState(nodeOrState)

        if (this.getState().compare(node.state))
            return // weird ik

        return this.moveBlankToTile(Node.fromNodeOrState(nodeOrState).state.indexOf(0))
    }

    changeStateWithChecks(nodeOrState) {
        // todo ismovelegal etc

        return this.changeState(nodeOrState)
    }

    assignOrAddPieceToTile(pieceId, $tile) {
        const $piece = this.pieces().find($piece => $piece.pieceId === pieceId) ?? this.$grid.appendChild(this.createPiece(pieceId))
        this.assignPieceToTile($piece, $tile)
    }

    clickMove($piece, startXY, endXY) {
        if (util.getDistance(startXY, endXY) > $piece.clientWidth / 4)
            return false
    
        const blankIndex = this.adjacentEmpty($piece.$tile.tileId)[0]
        if (blankIndex === undefined)
            return false
    
        this.movePieceToTile($piece, this.grid[blankIndex])
        return true
    }

    swipeMove($piece, startXY, endXY) {
        const deltaXY = util.getDifference(endXY, startXY)
        const direction = util.coordinateToDirection(deltaXY)
        const indexXY = util.offset(util.getCoordinates(this.columns, $piece.$tile.tileId), util.directionToCoordinates(direction))
        const index = util.getIndex(indexXY.x, indexXY.y, this.columns)
    
        if (this.grid[index]?.$piece !== null)
            return false
    
        this.movePieceToTile($piece, this.grid[index])
        return true
    }

    addPieceEvents($piece) {
        $piece.addEventListener('mousedown', eMouseDown => {
            if (eMouseDown.buttons !== 1)
                return

            eMouseDown.preventDefault()
            $piece.style.cursor = 'grabbing'
            // turns out this is the bottleneck so the devtools was kinda right because it was saying that mousedown event takes the longest
            // window.document.body.style.cursor = 'grabbing'

            window.addEventListener('mouseup', eMouseUp => {
                this.clickMove($piece, eMouseDown, eMouseUp) || this.swipeMove($piece, eMouseDown, eMouseUp)
                $piece.style.cursor = 'grab'
                window.document.body.style.cursor = ''
            }, { once: true })
        })
    
        $piece.addEventListener('touchstart', eTouchStart => {
            const startXY = util.xy(eTouchStart.changedTouches[0].screenX, eTouchStart.changedTouches[0].screenY)
    
            window.addEventListener('touchend', eTouchEnd => {
                const endXY = util.xy(eTouchEnd.changedTouches[0].screenX, eTouchEnd.changedTouches[0].screenY)
                this.clickMove($piece, startXY, endXY) || this.swipeMove($piece, startXY, endXY)
            }, { once: true })
        })
    }

    async resizeCallback() {
        // i need to somehow limit the amount of time resizeobserver takes
        // this.$grid.parentElement?.removeChild(this.$grid)
        
        const { width, height } = this.$parent.getBoundingClientRect()
        const totalMargin = this.margin * 2
        this.tileSize = Math.floor(Math.min((height - totalMargin) / this.rows, (width - totalMargin) / this.columns))
        const gridWidth = this.tileSize * this.columns
        const gridHeight = this.tileSize * this.rows

        this.$grid.style.width = gridWidth + 'px'
        this.$grid.style.height = gridHeight + 'px'
        this.grid.forEach($tile => this.adjustTile($tile, this.tileSize))

        const scaledImgUrl = await Grid.getScaledPicture(gridWidth, gridHeight, await this.picture)
        this.$style.piece['background-image'] = `url(${scaledImgUrl})`
        this.$style.apply()
    
        this.pieces().forEach(async $piece => {
            const coordinates = util.getCoordinates(this.columns, this.initialState.indexOf($piece.pieceId))
            const { x, y } = util.add(util.scale(coordinates, this.tileSize), this.tileSize * (1 - this.pieceRatio))

            // this needs to be moved to a class because it destroys devtools
            // $piece.style.backgroundImage = `url(${scaledImgUrl})`
            $piece.style.backgroundPosition = `-${x}px -${y}px`
        })

        this.$grid.classList.toggle('is-hidden', false)
        this.onInit.forEach(handler => handler())
        // this.$parent.appendChild(this.$grid)
    }
    
    getResizeObserver() {
        const observer = new ResizeObserver(() => this.resizeCallback())
        observer.observe(this.$parent)
        return observer
    }

    adjustTile($tile, tileSize) {
        const { x, y } = util.getCoordinates(this.columns, $tile.tileId)
        $tile.rect = new util.Rectangle(tileSize, tileSize, y * tileSize + tileSize / 2, x * tileSize + tileSize / 2)
        $tile.rect.apply($tile)

        if ($tile.$piece !== null)
            this.assignPieceToTile($tile.$piece, $tile)
    }

    createGrid() {
        const $grid = document.createElement('div')
        $grid.addEventListener('mousemove', e => e.preventDefault())
        $grid.addEventListener('touchstart', e => e.preventDefault())
        $grid.classList.add('grid', 'is-hidden')

        this.grid = Array.range(this.rows * this.columns).map(id => $grid.appendChild(this.createTile(id)))
        // this.grid.forEach($tile => $grid.appendChild($tile))

        return $grid
    }

    updateCorrectness($piece = null) {
        const correctTiles = this.getPuzzle().getCorrectTilesWithout0()
        const $pieces = $piece === null ? this.pieces() : [$piece]
        $pieces.forEach($piece => $piece.classList.toggle('correct', correctTiles.includes($piece.$tile.tileId)))
    }

    getPuzzle() {
        return new EightPuzzle(this.columns, this.rows, this.getState())
    }

    getPiece(id) {
        return this.pieces().find($piece => $piece.pieceId === id)
    }

    getState() {
        return this.grid.map($tile => $tile.$piece?.pieceId ?? 0)
    }

    setState(nodeOrState) {
        Node.fromNodeOrState(nodeOrState).state.forEach((pieceId, tileId) => pieceId !== 0 && this.assignOrAddPieceToTile(pieceId, this.grid[tileId]))
        this.updateCorrectness()
    }

    adjacentEmpty(index) {
        return util.getAdjacent(this.columns, this.rows, index).filter(action => this.grid[action].$piece === null)
    }

    // might need to add tileLoop and pieceLoop
    pieces() {
        return this.grid.map($tile => $tile.$piece).filter($piece => $piece)
    }

    setPicture(url) {
        return this.picture = fetch(url).then(async r => URL.createObjectURL(await r.blob()))
    }

    get isSolved() {
        return this.getPuzzle().isGoal()
    }

    async *streamChange(arrayOrGenerator) {
        if (!this.edit)
            return

        this.edit = false

        for (const state of arrayOrGenerator)
            yield await this.changeState(state)
    
        this.edit = true
    }

    async changeToState(arrayOrGenerator) {
        for await (const _ of this.streamChange(arrayOrGenerator))
            continue
    }

    changeToNode(node) {
        return this.changeToState(node.getPath().map(n => n.state)) 
    }

    *shuffle() {
        yield* this.streamChange(this.getPuzzle().randomMoves())
    }
    
    // could also have a method that returns a controller for the generator consumer that allows to pause etc but this is probably redunadnt and not useful
    // you can control the stream by just calling next().value

    setRandomPicture() {
        // needs to be adjusted because smaller grid sizes have worse quality pictures
        const picWidth = Math.min(1000, this.columns * 100)
        const picHeight = Math.min(1000, this.rows * 100)
        return this.setPicture(`https://picsum.photos/${picWidth}/${picHeight}`)
    }

    static getScaledPicture(width, height, urlObj) {
        const image = new Image()
        image.src = urlObj
    
        return new Promise(resolve => {
            image.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = width
                canvas.height = height
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL('image/png'))
            }
        })
    }

    async setRandomState() {
        this.setState((await EightPuzzle.random(this.columns, this.rows, this.goalState)).initialState)
    }

    solve() {
        return this.changeToNode(this.getPuzzle().tryGetSolution())
    }

    createStyle() {
        const $style = document.createElement('style')
        const getRules = (selector, rules) => `${selector} { ${Object.entries(rules).map(r => r.join(':')).join(';')} }`

        $style.tile = {
            position: 'absolute',
            transform: 'translate(-50%, -50%)'
        }

        $style.piece = {
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            cursor: 'grab'
        }

        $style.apply = () => $style.innerHTML = getRules('[data-tile]', $style.tile) + getRules('[data-piece]', $style.piece)

        $style.apply()
        return $style
    }

    print() {
        util.print2dState(this.getState(), this.columns, this.rows)
    }
}