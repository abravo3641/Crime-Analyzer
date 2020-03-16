const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql'); 
const app = express();

require('dotenv').config(); // Lets us use the env file

const { PORT, DB_HOST, DB_USER, DB_PASS, DB_DATABASE } = process.env;

//Module needed
const Square = require('./crimeAnalyzerModules/square')


let connection = mysql.createConnection({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASS,
	database: DB_DATABASE
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
            'lat':  bigSquare.bottomLeft.lat-getGridSquareSize(), 
            'long': bigSquare.topLeft.long-getGridSquareSize()
        },
        {
            'lat':  bigSquare.topRight.lat+getGridSquareSize(), 
            'long': bigSquare.topRight.long+getGridSquareSize()
        }
    );

    //Get Squares that are inside big Biased Square
    let grid = [];
    const restrictionLat = `BETWEEN ${bigSquareBias.bottomLeft.lat} AND ${bigSquareBias.topLeft.lat}`;
    const restrictionLong = `BETWEEN ${bigSquareBias.topLeft.long} AND ${bigSquareBias.topRight.long}`
    let q = `SELECT * FROM grid_${dayOfWeek.toLowerCase()} WHERE upper_left_lat ${restrictionLat} AND upper_left_long ${restrictionLong} AND lower_right_lat ${restrictionLat} AND lower_right_long ${restrictionLong}`;
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
        const activatedWindows = getActivatedWindows(grid,dayOfWeek);
        console.log(`Number of windows that passed a thr of ${getThreshold(dayOfWeek)} crimes : ${activatedWindows.length}`)

        // Call python Script to display map
        printToMap(currentPoint,destinationPoint,bigSquare,grid,activatedWindows);

        res.json(activatedWindows);
    })
})

// Minimum number of crimes to activate sliding window 
function getThreshold(dayOfWeek) {
    // Average number of crimes per square based on weekday
    const thr = {
        all: 911,
        monday: 121,
        tuesday: 132,
        wednesday: 137,
        thursday: 139,
        friday: 150,
        saturday: 138,
        sunday: 117
    }
    return thr[dayOfWeek.toLowerCase()];
}

// Get the windows that pass the threshold value
function getActivatedWindows(grid,dayOfWeek) {
    //Least number of crimes to pass thr
    const thr = getThreshold(dayOfWeek); 
    const activatedWindows = grid.filter(sqr => sqr.numOfCrimes >= thr);
    return activatedWindows;
}

//The size of each grid square
function getGridSquareSize() {
    const size = 0.0018;
    return size;
}


function printToMap(...arg) {
    const {spawn} = require("child_process");
    //JSON array that we will pass to python process
    let arr = arg.map(obj => JSON.stringify(obj));
    const pythonProcess = spawn('python',["./vizualization/map.py",...arr]);    
}

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    //init();
})
