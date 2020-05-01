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

    // Dimensions in lat lot measurement
    getDimensions() {
        return {
            length: this.topLeft.lat - this.bottomLeft.lat,
            width: Math.abs(this.topLeft.long) - Math.abs(this.topRight.long)
        }
    }

    // Dimensions in meter
    getDimensionsMeters() {
        function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
            var R = 6378.137; // Radius of earth in KM
            var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
            var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c;
            return d * 1000; // meters
        }

        let {length,width} = this.getDimensions();
        length = measure(0,0,0,length).toFixed(2);
        width = measure(0,0,0,width).toFixed(2);

        return {length,width};
    }

    isEqual(window) {
        const topLeftCheck = this.topLeft.lat == window.topLeft.lat && this.topLeft.long == window.topLeft.long;
        const topRightCheck = this.topRight.lat == window.topRight.lat && this.topRight.long == window.topRight.long
        const bottomLeftCheck = this.bottomLeft.lat == window.bottomLeft.lat && this.bottomLeft.long == window.bottomLeft.long
        const bottomRightCheck = this.bottomRight.lat == window.bottomRight.lat && this.bottomRight.long == window.bottomRight.long

        return (topLeftCheck && topRightCheck && bottomLeftCheck && bottomRightCheck);
    }

    clone() {
        return (new Square(this.topLeft,this.bottomRight));
    }
}

module.exports = Square;

