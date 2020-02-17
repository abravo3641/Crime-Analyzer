const Point = require('./point');

class Square {
    /*
        UL      UR

        LL      LR
    */

    // Takes 2 oppossite points (upperLeft,lowerRight) or (upperRight,lowerLeft) and makes square out of it
    constructor(Pi,Pj) {
        this.upperLeft = {'lat': Math.max(Pi.lat, Pj.lat), 'long': Math.min(Pi.long,Pj.long)},
        this.upperRight = {'lat': Math.max(Pi.lat, Pj.lat), 'long': Math.max(Pi.long,Pj.long)},
        this.lowerLeft = {'lat': Math.min(Pi.lat, Pj.lat), 'long': Math.min(Pi.long,Pj.long)},
        this.lowerRight = {'lat': Math.min(Pi.lat, Pj.lat), 'long': Math.max(Pi.long,Pj.long)}
    }

    getDimensions() {
        return {
            length: this.upperLeft.lat - this.lowerLeft.lat,
            width: Math.abs(this.upperLeft.long) - Math.abs(this.upperRight.long)
        }
    }

    clone() {
        return {
            upperLeft: {...this.upperLeft},
            upperRight: {...this.upperRight},
            lowerLeft: {...this.lowerLeft},
            lowerRight: {...this.lowerRight}
        }
    }
}

module.exports = Square;

