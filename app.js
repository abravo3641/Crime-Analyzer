const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const port = 8080;
const fs = require('fs');
const app = express();


let connection = mysql.createConnection({
	host:'localhost',
	user: 'root',
	password: 'anthony1998',
	database: 'seniorDesignDataManhattan'
});

connection.connect((err)=> {
	if (err) throw err;
});

//Middlewares
app.use(bodyParser.json());

app.get('/crimeAnalyzer', (req,res) => {
    //Req should contain a current location and destination location obj
    let {currentLocation,destinationLocation} = req.body;

    let square = {
        x1: currentLocation.long,
        x2: destinationLocation.long,
        y1: currentLocation.lat,
        y2: destinationLocation.lat
    }

    //Response is an array of crime objects that are inside of the square
    let limit = 'LIMIT 1000';
    let q = `SELECT latitude,longitude FROM nyCrime WHERE latitude BETWEEN ${Math.min(square.y1,square.y2)} AND ${Math.max(square.y1,square.y2)} AND longitude BETWEEN ${Math.min(square.x1,square.x2)} AND ${Math.max(square.x1,square.x2)} ${limit}`;
    connection.query(q, (err,crimes) => {

        // Make sliding Window
        let window = constructWindow(currentLocation,destinationLocation);
        
        // Move the sliding Window
        let grid = moveWindow(currentLocation,destinationLocation,window);

        // Call python Script to display map
        printToMap(crimes,currentLocation,destinationLocation,window,grid);
        
        res.send('done!');
    });

})

// Returns an array of ALL the squares the sliding window slides through
function moveWindow(currentLocation, destinationLocation ,window){
    const bigSquare = getBigSquare(currentLocation,destinationLocation);
    let grid = [];
    let {p1,p2,p3,p4} = window;
    //Dimensions of smaller square
    const lSmall = p1.lat - p3.lat;
    const wSmall = Math.abs(p1.long) - Math.abs(p2.long);

    // Added toFixed(8) for rounding errors 
    while(p1.lat.toFixed(8) > bigSquare.p3.lat.toFixed(8)) {
        console.log(p1)
        while(Math.abs(p1.long.toFixed(8)) > Math.abs(bigSquare.p2.long.toFixed(8))) {
            grid.push({p1: {...p1},p2: {...p2},p3: {...p3},p4: {...p4}});
            p1.long += wSmall;
            p2.long += wSmall;
            p3.long += wSmall;
            p4.long += wSmall;
        }
        //Reset square back to the left and update latitude
        p1.long = p3.long = bigSquare.p1.long;
        p2.long = p4.long = p1.long + wSmall;
        p1.lat = p2.lat = p1.lat - lSmall;
        p3.lat = p4.lat = p3.lat - lSmall;

    }

    

    return grid;
    
}

// This returns the initial posisiton of the sliding window
function constructWindow(currentLocation,destinationLocation) {
    const k = 0.1; //hard coded k value

    //Dimensions of big square
    const bigSquare = getBigSquare(currentLocation,destinationLocation);
    const {p1,p2,p3,p4} = bigSquare;
    const lBig = p1.lat - p3.lat;
    const wBig = Math.abs(p1.long) - Math.abs(p2.long);

    //Dimensions of small square
    const lSmall = k * lBig;
    const wSmall = k * wBig;

    //Window at the top left corner
    let window = {
        p1: {'lat': p1.lat, 'long': p1.long},
        p2: {'lat': p1.lat, 'long': p1.long+wSmall},
        p3: {'lat': p1.lat-lSmall, 'long': p1.long},
        p4: {'lat': p1.lat-lSmall, 'long': p1.long+wSmall}
    };

    return window;
}

// Gets the point locations of the big square 
function getBigSquare(currentLocation,destinationLocation) {
    return {
        p1: {'lat': Math.max(currentLocation.lat, destinationLocation.lat), 'long': Math.min(currentLocation.long,destinationLocation.long)},
        p2: {'lat': Math.max(currentLocation.lat, destinationLocation.lat), 'long': Math.max(currentLocation.long,destinationLocation.long)},
        p3: {'lat': Math.min(currentLocation.lat, destinationLocation.lat), 'long': Math.min(currentLocation.long,destinationLocation.long)},
        p4: {'lat': Math.min(currentLocation.lat, destinationLocation.lat), 'long': Math.max(currentLocation.long,destinationLocation.long)}
    }
}

function printToMap(crimes, currentLocation, destinationLocation, window, grid) {
    const {spawn} = require("child_process");
    const pythonProcess = spawn('python',["./vizualization/map.py",JSON.stringify(crimes),JSON.stringify(currentLocation),JSON.stringify(destinationLocation),JSON.stringify(window),JSON.stringify(grid)]);
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
