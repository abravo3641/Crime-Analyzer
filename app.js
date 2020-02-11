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
        // Call python Script to display map
        printToMap(crimes,currentLocation,destinationLocation,window);
        
        res.send('done!');
    });

})

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

function printToMap(crimes, currentLocation, destinationLocation, window) {
    const {spawn} = require("child_process");
    const pythonProcess = spawn('python',["./vizualization/map.py",JSON.stringify(crimes),JSON.stringify(currentLocation),JSON.stringify(destinationLocation),JSON.stringify(window)]);
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
