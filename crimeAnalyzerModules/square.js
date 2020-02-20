const Point = require('./point');

class Square {
    /*
        TL      TR

        BL      BR
    */

    // Takes 2 oppossite points (topLeft,bottomRight) or (topRight,bottomLeft) and makes square out of it
    constructor(Pi,Pj) {
        this.topLeft = {'lat': Math.max(Pi.lat, Pj.lat), 'long': Math.min(Pi.long,Pj.long)},
        this.topRight = {'lat': Math.max(Pi.lat, Pj.lat), 'long': Math.max(Pi.long,Pj.long)},
        this.bottomLeft = {'lat': Math.min(Pi.lat, Pj.lat), 'long': Math.min(Pi.long,Pj.long)},
        this.bottomRight = {'lat': Math.min(Pi.lat, Pj.lat), 'long': Math.max(Pi.long,Pj.long)}
    }

    getDimensions() {
        return {
            length: this.topLeft.lat - this.bottomLeft.lat,
            width: Math.abs(this.topLeft.long) - Math.abs(this.topRight.long)
        }
    }

    clone() {
        return {
            topLeft: {...this.topLeft},
            topRight: {...this.topRight},
            bottomLeft: {...this.bottomLeft},
            bottomRight: {...this.bottomRight}
        }
    }
}

module.exports = Square;

