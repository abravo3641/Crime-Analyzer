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
    //Req should contain a current point and destination point

    let {currentPoint,destinationPoint} = req.body;  

    // Getting coordinates of the bigSquare
    let bigSquare = new Square(currentPoint,destinationPoint);

    //Response is an array of crime objects that are inside of the square
    let limit = 'LIMIT 1000';
    let order = '';
    let q = `SELECT latitude,longitude FROM nyCrime WHERE latitude BETWEEN ${bigSquare.lowerLeft.lat} AND ${bigSquare.upperLeft.lat} AND longitude BETWEEN ${bigSquare.upperLeft.long} AND ${bigSquare.upperRight.long} ${order} ${limit}`;
    connection.query(q, (err,crimes) => {

        if(err) throw new Error;

        // Create and move sliding window
        const {grid,activatedWindows} = moveSlidingWindow(bigSquare,crimes);

        // Number of windows that passed threshold
        console.log(`Number of windows that passed a thr of ${getThreshold(crimes)}% : ${activatedWindows.length}`)

        // Call python Script to display map
        printToMap({},currentPoint,destinationPoint,bigSquare,grid,activatedWindows);

        //Send array of windows that passed thr as response
        res.json(activatedWindows);
    });
})

// Returns an array of ALL the squares the sliding slidingWindow slides through
function moveSlidingWindow(bigSquare,crimes){
    let grid = [];
    let activatedWindows = [];

    // Calculate the threshold
    const thr = getThreshold(crimes);

    // Initialize position of sliding window
    let slidingWindow = constructSlidingWindow(bigSquare);
    let {upperLeft,upperRight,lowerLeft,lowerRight} = slidingWindow;

    //Dimensions of smaller square
    const {length,width} = slidingWindow.getDimensions();

    /*Added toFixed(8) for rounding errors  */

    //Still inside of the big square
    while(upperLeft.lat.toFixed(8) > bigSquare.lowerLeft.lat.toFixed(8)) {
        while(Math.abs(upperLeft.long.toFixed(8)) > Math.abs(bigSquare.upperRight.long.toFixed(8))) {

            //Check if window is overFlowed on long
            if(Math.abs(upperRight.long.toFixed(8)) < Math.abs(bigSquare.upperRight.long.toFixed(8))) {
                upperRight.long = lowerRight.long = bigSquare.upperRight.long;
            }

            //Calculate number of crimes inside the sliding window
            let numOfCrimes = 0;
            crimes.forEach(crime => {
                //Crime is inside the sliding window
                if( (crime.latitude > lowerLeft.lat && crime.latitude < upperLeft.lat) && (Math.abs(crime.longitude) < Math.abs(upperLeft.long) && Math.abs(crime.longitude) > Math.abs(upperRight.long)) ) {
                    numOfCrimes++;
                }
            })

            let slidingWindowClone = slidingWindow.clone();

            //Check if window passes threshold
            if(numOfCrimes >= thr) activatedWindows.push(slidingWindowClone)

            //Copy the points and put then on the grid to save
            grid.push(slidingWindowClone);

            //Move sliding window to the right
            upperLeft.long += width;
            upperRight.long += width;
            lowerLeft.long += width;
            lowerRight.long += width;

        }
        //Reset square back to the left and update latitude(move sliding window down)
        upperLeft.long = lowerLeft.long = bigSquare.upperLeft.long;
        upperRight.long = lowerRight.long = upperLeft.long + width;
        upperLeft.lat  = upperRight.lat  = upperLeft.lat - length;
        lowerLeft.lat  = lowerRight.lat  = lowerLeft.lat - length;

        //Check if window is overFlowed on lat
        if(lowerLeft.lat < bigSquare.lowerLeft.lat) {
            lowerLeft.lat = lowerRight.lat = bigSquare.lowerLeft.lat;
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
    const {upperLeft} = bigSquare;
    const {length,width} = bigSquare.getDimensions();

    //Dimensions of small square
    const lSmall = k * length;
    const wSmall = k * width;

    //return square at the top left corner
    return new Square(bigSquare.upperLeft,{'lat': upperLeft.lat-lSmall, 'long': upperLeft.long+wSmall});
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
