const Point = require('./point');

class Square {
    /*
        p1      p2

        p3      p4
    */

    // Takes 2 oppossite points (p1,p4) or (p2,p3) and makes square out of it
    constructor(Pi,Pj) {
        this.p1 = {'lat': Math.max(Pi.lat, Pj.lat), 'long': Math.min(Pi.long,Pj.long)},
        this.p2 = {'lat': Math.max(Pi.lat, Pj.lat), 'long': Math.max(Pi.long,Pj.long)},
        this.p3 = {'lat': Math.min(Pi.lat, Pj.lat), 'long': Math.min(Pi.long,Pj.long)},
        this.p4 = {'lat': Math.min(Pi.lat, Pj.lat), 'long': Math.max(Pi.long,Pj.long)}
    }

    getDimensions() {
        return {
            length: this.p1.lat - this.p3.lat,
            width: Math.abs(this.p1.long) - Math.abs(this.p2.long)
        }
    }
}

module.exports = Square;

