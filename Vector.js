import * as util from './interface.js'

export default class Vector {
    constructor(...params) {
        this.params = params
    }

    get x() { return this.params[0] }
    get y() { return this.params[1] }

    negate() {
        return new Vector(...this.params.map(p => -p))
    }

    add(value) {
        return new Vector(...this.params.map(p => p + value))
    }

    offset(vector) {
        return new Vector(...this.params.map((p, idx) => p + vector.params[idx]))
    }

    scale(value) {
        return new Vector(...this.params.map(p => p * value))
    }

    floor() {
        return new Vector(...this.params.map(Math.floor))
    }

    distance2D({ x, y }) {
        return Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2))
    }
}