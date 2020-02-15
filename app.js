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
    let q = `SELECT latitude,longitude FROM nyCrime WHERE latitude BETWEEN ${bigSquare.lowerLeft.lat} AND ${bigSquare.upperLeft.lat} AND longitude BETWEEN ${bigSquare.upperLeft.long} AND ${bigSquare.upperRight.long} ${limit}`;
    connection.query(q, (err,crimes) => {
        
        // Create and move sliding window
        let grid = moveSlidingWindow(bigSquare);

        // Call python Script to display map
        printToMap(crimes,currentPoint,destinationPoint,bigSquare,grid);
        
        res.send('done!');
    });
})

// Returns an array of ALL the squares the sliding slidingWindow slides through
function moveSlidingWindow(bigSquare){
    let grid = [];

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

            //Copy the points and put then on the grid to save
            grid.push({upperLeft: {...upperLeft},upperRight: {...upperRight},lowerLeft: {...lowerLeft},lowerRight: {...lowerRight}});
            upperLeft.long += width;
            upperRight.long += width;
            lowerLeft.long += width;
            lowerRight.long += width;

        }
        //Reset square back to the left and update latitude
        upperLeft.long = lowerLeft.long = bigSquare.upperLeft.long;
        upperRight.long = lowerRight.long = upperLeft.long + width;
        upperLeft.lat  = upperRight.lat  = upperLeft.lat - length;
        lowerLeft.lat  = lowerRight.lat  = lowerLeft.lat - length;

        //Check if window is overFlowed on lat
        if(lowerLeft.lat < bigSquare.lowerLeft.lat) {
            lowerLeft.lat = lowerRight.lat = bigSquare.lowerLeft.lat;
        }

    }
    return grid;
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
