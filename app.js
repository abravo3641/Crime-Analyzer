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

    // Getting coordinates of the bigSquare
    let bigSquare = new Square(currentPoint,destinationPoint);

    // Updated bigSquare with biased points
    let bigSquareBias = new Square(
        {
            'lat':  bigSquare.bottomLeft.lat-getSize(), 
            'long': bigSquare.topLeft.long-getSize()
        },
        {
            'lat':  bigSquare.topRight.lat+getSize(), 
            'long': bigSquare.topRight.long+getSize()
        }
    );

    //Get Squares that are inside big Biased Square
    let grid = [];
    const restrictionLat = `BETWEEN ${bigSquareBias.bottomLeft.lat} AND ${bigSquareBias.topLeft.lat}`;
    const restrictionLong = `BETWEEN ${bigSquareBias.topLeft.long} AND ${bigSquareBias.topRight.long}`
    let q = `SELECT * FROM Grid WHERE upper_left_lat ${restrictionLat} AND upper_left_long ${restrictionLong} AND lower_right_lat ${restrictionLat} AND lower_right_long ${restrictionLong}`;
    connection.query(q, (err,squares) => {
        
        let totalNumOfCrimes = 0;
        squares.forEach(sqr => {
            let Pi = {'lat': sqr.upper_left_lat , 'long': sqr.upper_left_long};
            let Pj = {'lat': sqr.lower_right_lat, 'long': sqr.lower_right_long};
            let sqrObj = new Square(Pi,Pj);
            sqrObj.numOfCrimes = sqr.number_of_crimes;
            totalNumOfCrimes += sqr.number_of_crimes;
            grid.push(sqrObj);
        });

        // Get number of windows that passed threshold
        const activatedWindows = getActivatedWindows(grid,totalNumOfCrimes);
        console.log(`Number of windows that passed a thr of ${getThreshold(grid,totalNumOfCrimes)} crimes : ${activatedWindows.length}`)

        // Call python Script to display map
        printToMap(currentPoint,destinationPoint,bigSquare,grid,activatedWindows);

        res.json(activatedWindows);
    })
})

// Minimum number of crimes to activate sliding window 
function getThreshold(grid,totalNumOfCrimes) {
    const thr = 2.5; // in percent
    return Math.floor(thr/100*totalNumOfCrimes);
}

// Get the windows that pass the threshold value
function getActivatedWindows(grid,totalNumOfCrimes) {
    //Least number of crimes to pass thr
    const thr = getThreshold(grid,totalNumOfCrimes); 
    const activatedWindows = grid.filter(sqr => sqr.numOfCrimes >= thr);
    return activatedWindows;
}

//The size of each grid square
function getSize() {
    const size = 0.0018;
    return size;
}


function printToMap(...arg) {
    const {spawn} = require("child_process");
    //JSON array that we will pass to python process
    let arr = arg.map(obj => JSON.stringify(obj));
    const pythonProcess = spawn('python',["./vizualization/map.py",...arr]);    
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    //init();
})
