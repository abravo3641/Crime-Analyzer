const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql'); 
const app = express();

require('dotenv').config(); // Lets us use the env file
const port = process.env.PORT || 8080;

//Module needed
const Square = require('./crimeAnalyzerModules/square')

let connection = mysql.createConnection({
	host: process.env.host,
	user: process.env.user,
	password: process.env.password,
	database: process.env.database
});

connection.connect((err)=> {
	if (err) throw err;
}); 
 
//Middlewares
app.use(bodyParser.json());

app.get('/crimeAnalyzer', (req,res) => {
    //Req should contain a current point, destination point, and dayOfWeek that user is using application

    let {currentPoint,destinationPoint,dayOfWeek} = req.body;
    
    //Validate that the current and destination point are far apart to form a square around
    let {updatedCurrentPoint,updatedDestinationPoint} = validatePoints(currentPoint,destinationPoint);

    // Getting coordinates of the bigSquare
    let bigSquare = new Square(updatedCurrentPoint,updatedDestinationPoint);

    //Response is an array of crime objects that are inside of the square
    let limit = '';
    let order = '';
    let q = `SELECT latitude,longitude FROM nyCrime${dayOfWeek} WHERE latitude BETWEEN ${bigSquare.bottomLeft.lat} AND ${bigSquare.topLeft.lat} AND longitude BETWEEN ${bigSquare.topLeft.long} AND ${bigSquare.topRight.long} ${order} ${limit}`;
    connection.query(q, (err,crimes) => {

        if(err) throw new Error;

        // Create and move sliding window
        const {grid,activatedWindows} = moveSlidingWindow(bigSquare,crimes);

        // Number of windows that passed threshold
        console.log(`Number of windows that passed a thr of ${getThreshold(crimes)} crimes : ${activatedWindows.length}`)

        // Call python Script to display map
        printToMap({},currentPoint,destinationPoint,bigSquare,grid,activatedWindows);

        //Send array of windows that passed thr as response
        res.json(activatedWindows);
    });
})

function validatePoints(currentPoint,destinationPoint) {

    //Mininum difference that two lat/long lines must apart before they are seperated
    const thr = 0.0036869999999993297; 

    const latDiff = Math.abs(currentPoint.lat - destinationPoint.lat);
    const longDiff = Math.abs(Math.abs(currentPoint.long) - Math.abs(destinationPoint.long));
    
    // Check if latitude lines are too close together

    //Check to seperate latitude
    if(latDiff < thr) {
        console.log(`Latitude lines are too closed together: ${latDiff}`);
    }

    //Check to seperate longitude
    if(longDiff < thr) {
        console.log(`Longitude lines are too closed together: ${longDiff}`);
    }    

    return {
        updatedCurrentPoint: currentPoint,
        updatedDestinationPoint: destinationPoint
    };
}

// Returns an array of ALL the squares the sliding slidingWindow slides through
function moveSlidingWindow(bigSquare,crimes){
    let grid = [];
    let activatedWindows = [];

    // Calculate the threshold
    const thr = getThreshold(crimes);

    // Initialize position of sliding window
    let slidingWindow = constructSlidingWindow(bigSquare);
    let {topLeft,topRight,bottomLeft,bottomRight} = slidingWindow;

    //Dimensions of smaller square
    const {length,width} = slidingWindow.getDimensions();

    /*Added toFixed(8) for rounding errors  */

    //Still inside of the big square
    while(topLeft.lat.toFixed(8) > bigSquare.bottomLeft.lat.toFixed(8)) {
        while(Math.abs(topLeft.long.toFixed(8)) > Math.abs(bigSquare.topRight.long.toFixed(8))) {

            //Check if window is overFlowed on long
            if(Math.abs(topRight.long.toFixed(8)) < Math.abs(bigSquare.topRight.long.toFixed(8))) {
                topRight.long = bottomRight.long = bigSquare.topRight.long;
            }

            //Calculate number of crimes inside the sliding window
            let numOfCrimes = 0;
            crimes.forEach(crime => {
                //Crime is inside the sliding window
                if( (crime.latitude > bottomLeft.lat && crime.latitude < topLeft.lat) && (Math.abs(crime.longitude) < Math.abs(topLeft.long) && Math.abs(crime.longitude) > Math.abs(topRight.long)) ) {
                    numOfCrimes++;
                }
            })

            let slidingWindowClone = slidingWindow.clone();

            //Check if window passes threshold
            if(numOfCrimes >= thr) activatedWindows.push(slidingWindowClone)

            //Copy the points and put then on the grid to save
            grid.push(slidingWindowClone);

            //Move sliding window to the right
            topLeft.long += width;
            topRight.long += width;
            bottomLeft.long += width;
            bottomRight.long += width;

        }
        //Reset square back to the left and update latitude(move sliding window down)
        topLeft.long = bottomLeft.long = bigSquare.topLeft.long;
        topRight.long = bottomRight.long = topLeft.long + width;
        topLeft.lat  = topRight.lat  = topLeft.lat - length;
        bottomLeft.lat  = bottomRight.lat  = bottomLeft.lat - length;

        //Check if window is overFlowed on lat
        if(bottomLeft.lat < bigSquare.bottomLeft.lat) {
            bottomLeft.lat = bottomRight.lat = bigSquare.bottomLeft.lat;
        }

    }
    return {grid,activatedWindows};
}


// Minimum number of crimes to activate sliding window 
function getThreshold(crimes) {
    const thr = 2; 
    return (thr/100*crimes.length);
}

// This returns the initial posisiton of the sliding window
function constructSlidingWindow(bigSquare) {
    const k = 0.1; //hard coded k value

    //Dimensions of big square
    const {topLeft} = bigSquare;
    const {length,width} = bigSquare.getDimensions();

    //Dimensions of small square
    const lSmall = k * length;
    const wSmall = k * width;

    //return square at the top left corner
    return new Square(bigSquare.topLeft,{'lat': topLeft.lat-lSmall, 'long': topLeft.long+wSmall});
}

function printToMap(...arg) {
    const {spawn} = require("child_process");
    //JSON array that we will pass to python process
    let arr = arg.map(obj => JSON.stringify(obj));
    const pythonProcess = spawn('python',["./vizualization/map.py",...arr]);    
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
