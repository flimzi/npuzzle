import * as util from './interface.js'

export default class Grid {
    constructor($parent, rows, columns = null, initialState = null) {
        this.$parent = $parent
        this.rows = rows
        this.columns = columns ?? rows
        this.initialState = initialState ?? Array.range(this.rows * this.columns).toShiftedLeft()
        this.$grid = this.createGrid()
        this.setRandomPicture()
        this.resizeObserver = this.getResizeObserver()
        // this.pieceRatio = .98
        this.pieceRatio = 1
        this.showLabels = false
        this.setState(this.initialState)
        this.margin = 0

        $parent.appendChild(this.$grid)
    }

    createTile(id) {
        const $tile = document.createElement('div')
        $tile.tileId = id
        $tile.style.position = 'absolute'
        $tile.style.transform = 'translate(-50%, -50%)'
        $tile.setAttribute('data-tile', $tile.tileId)
        $tile.$piece = null

        return $tile
    }

    createPiece(id) {
        const $piece = document.createElement('div')
        $piece.pieceId = id
        $piece.style.position = 'absolute'
        $piece.style.transform = 'translate(-50%, -50%)'
        $piece.style.cursor = 'grab'
        $piece.setAttribute('data-piece', $piece.pieceId)
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
    
        $piece.style.left = $tile.offsetLeft + 'px'
        $piece.style.top = $tile.offsetTop + 'px'
        $piece.style.width = $tile.clientWidth * this.pieceRatio + 'px'
        $piece.style.height = $tile.clientHeight * this.pieceRatio + 'px'
    }

    async movePieceToTile($piece, $tile, duration = 100) {
        $piece.style.transition = `top ${duration}ms linear, left ${duration}ms linear`
        this.assignPieceToTile($piece, $tile)
        await new Promise(r => setTimeout(r, duration))
        $piece.style.transition = ''
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
        let direction
    
        if (Math.abs(deltaXY.x) > Math.abs(deltaXY.y))
            direction = deltaXY.x > 0 ? util.Direction.Right : util.Direction.Left
        else
            direction = deltaXY.y > 0 ? util.Direction.Down : util.Direction.Up
    
        const indexXY = util.offset(util.getCoordinates(this.columns, $piece.$tile.tileId), util.directionToCoordinates(direction))
        const index = util.getIndex(indexXY.x, indexXY.y, this.columns)
    
        if (this.grid[index]?.$piece !== null)
            return false
    
        this.movePieceToTile($piece, this.grid[index])
        return true
    }

    addPieceEvents($piece) {
        $piece.addEventListener('mousedown', eMouseDown => {
            eMouseDown.preventDefault()
            $piece.style.cursor = window.document.body.style.cursor = 'grabbing'

            window.addEventListener('mouseup', eMouseUp => {
                this.clickMove($piece, eMouseDown, eMouseUp) || this.swipeMove($piece, eMouseDown, eMouseUp)
                $piece.style.cursor = 'grab'
                window.document.body.style.cursor = ''
                window.document.body.classList.toggle('nes-cursor', true)
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
    
    getResizeObserver() {
        // might need to debounce this
        let setup = true

        const callback = async entries => {
            // if (setup) {
            //     setup = false
            // } else {
            //     return
            // }

            // not sure if this is even needed or if we could use $parent.offsetWidth
            const { width, height } = this.$parent.getBoundingClientRect()
            const totalMargin = this.margin * 2
            const tileSize = Math.floor(Math.min((height - totalMargin) / this.rows, (width - totalMargin) / this.columns))
            const gridWidth = tileSize * this.columns
            const gridHeight = tileSize * this.rows

            this.$grid.style.width = gridWidth + 'px'
            this.$grid.style.height = gridHeight + 'px'
            this.grid.forEach($tile => this.adjustTile($tile, tileSize))

            const scaledImgUrl = await Grid.getScaledPicture(gridWidth, gridHeight, await this.picture)
            // const scaledImg = new Image()
            // scaledImg.src = scaledImgUrl

            // scaledImg.onload = () => {
            //     // this is redunant with the getscaledpicture so need to take it outside of there
            //     const canvas = document.createElement('canvas')
            //     const ctx = canvas.getContext('2d')
            //     canvas.width = gridWidth
            //     canvas.height = gridHeight
            //     ctx.drawImage(scaledImg, 0, 0, canvas.width, canvas.height)

            //     this.pieces().forEach(async $piece => {
            //         const { x, y } = util.getCoordinates(this.columns, this.initialState.indexOf($piece.pieceId))
            //         const pieceOffset = tileSize * (1 - this.pieceRatio)
            //         const offset = util.add(util.scale({ x, y }, tileSize), pieceOffset)
            //         const imageData = ctx.getImageData(offset.x, offset.y, tileSize * this.pieceRatio, tileSize * this.pieceRatio)

            //         $piece.style.backgroundImage = `url(${scaledImgUrl})`
            //         $piece.style.backgroundPosition = `-${x * tileSize + pieceOffset}px -${y * tileSize + pieceOffset}px`
            //         // actually we need to scratch that because i now want the wrong tiles be warning and good success
            //         // also add a frosting effect
            //         $piece.style.color = imageData.shouldTextBeWhite() ? 'white' : 'black'
            //     })
            // }
        
            this.pieces().forEach(async $piece => {
                const coordinates = util.getCoordinates(this.columns, this.initialState.indexOf($piece.pieceId))
                const { x, y } = util.add(util.scale(coordinates, tileSize), tileSize * (1 - this.pieceRatio))

                $piece.style.backgroundImage = `url(${scaledImgUrl})`
                $piece.style.backgroundPosition = `-${x}px -${y}px`
            })
        }

        const observer = new ResizeObserver(callback)
        observer.observe(this.$parent)
        return observer
    }

    adjustTile($tile, tileSize) {
        const { x, y } = util.getCoordinates(this.columns, $tile.tileId)
        $tile.style.width = $tile.style.height = tileSize + 'px'
        $tile.style.left = x * tileSize + tileSize / 2 + 'px'
        $tile.style.top = y * tileSize + tileSize / 2 + 'px'

        if ($tile.$piece !== null)
            this.assignPieceToTile($tile.$piece, $tile)
    }

    createGrid() {
        const $grid = document.createElement('div')
        $grid.addEventListener('mousemove', e => e.preventDefault())
        $grid.addEventListener('touchstart', e => e.preventDefault())
        $grid.classList.add('grid')

        this.grid = Array.range(this.rows * this.columns).map(this.createTile)
        this.grid.forEach($tile => $grid.appendChild($tile))

        return $grid
    }

    setState(state) {
        state.forEach((pieceId, tileId) => pieceId !== 0 && this.assignOrAddPieceToTile(pieceId, this.grid[tileId]))
    }

    adjacentEmpty(index) {
        return util.getAdjacent(this.columns, this.rows, index).filter(action => this.grid[action].$piece === null)
    }

    pieces() {
        return this.grid.map($tile => $tile.$piece).filter($piece => $piece)
    }

    setPicture(url) {
        return this.picture = fetch(url).then(async r => URL.createObjectURL(await r.blob()))
    }

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
}

// window.Grid = Grid
// window.util = util
// window.grid1 = new Grid(document.querySelector('.container'), 3, 5)
// window.grid1.pieceRatio = 1