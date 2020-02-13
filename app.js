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
    let q = `SELECT latitude,longitude FROM nyCrime WHERE latitude BETWEEN ${bigSquare.p3.lat} AND ${bigSquare.p1.lat} AND longitude BETWEEN ${bigSquare.p1.long} AND ${bigSquare.p2.long} ${limit}`;
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
    let {p1,p2,p3,p4} = slidingWindow;

    //Dimensions of smaller square
    const {length,width} = slidingWindow.getDimensions();

    /*Added toFixed(8) for rounding errors  */

    //Still inside of the big square
    while(p1.lat.toFixed(8) > bigSquare.p3.lat.toFixed(8)) {
        while(Math.abs(p1.long.toFixed(8)) > Math.abs(bigSquare.p2.long.toFixed(8))) {
            //Copy the points and put then on the grid to save
            grid.push({p1: {...p1},p2: {...p2},p3: {...p3},p4: {...p4}});
            p1.long += width;
            p2.long += width;
            p3.long += width;
            p4.long += width;
        }
        //Reset square back to the left and update latitude
        p1.long = p3.long = bigSquare.p1.long;
        p2.long = p4.long = p1.long + width;
        p1.lat  = p2.lat  = p1.lat - length;
        p3.lat  = p4.lat  = p3.lat - length;

    }
    return grid;
}

// This returns the initial posisiton of the sliding window
function constructSlidingWindow(bigSquare) {
    const k = 0.1; //hard coded k value

    //Dimensions of big square
    const {p1} = bigSquare;
    const {length,width} = bigSquare.getDimensions();

    //Dimensions of small square
    const lSmall = k * length;
    const wSmall = k * width;

    //return square at the top left corner
    return new Square(bigSquare.p1,{'lat': p1.lat-lSmall, 'long': p1.long+wSmall});
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
