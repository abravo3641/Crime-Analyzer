const express = require('express');
const bodyParser = require('body-parser');
const pgb = require('pg-promise')();
const app = express();

require('dotenv').config(); // Lets us use the env file

const { PORT, DB_HOST, DB_PORT ,DB_USER, DB_PASS, DB_DATABASE } = process.env;

//Module needed
const Square = require('./crimeAnalyzerModules/square')
const Grid = require('./crimeAnalyzerModules/grid')


const db = pgb({
    user: DB_USER,
    password: DB_PASS,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_DATABASE
});

db.connect()
 
//Middlewares
app.use(bodyParser.json());

app.get('/crimeAnalyzer', (req,res) => {

    //Req should contain a current point, destination point, and dayOfWeek that user is using application
    let {source,destination,dayOfWeek} = req.body;
    dayOfWeek = dayOfWeek.toLowerCase(); 

    // Getting coordinates of the bigSquare
    let bigSquare = new Square(source,destination); 

    // Updated bigSquare with biased points
    let queriedSquare = getQueriedSquare(bigSquare);


    getQueriedSquares(queriedSquare,dayOfWeek).then(squares => {
        
        // Cast database squares into module 'Square' obj
        const grid = castSquares(squares);

        // Get number of windows that passed threshold
        let activatedWindows = getActivatedWindows(grid,dayOfWeek);

        // Get all of manhattan regridded region
        let g = new Grid(activatedWindows)

        // Package adjacent activated rectangles into one
        g.maximumlRectangles() 
        activatedWindows = g.postGrid

        console.log(`Number of windows that passed a thr of ${getThreshold(dayOfWeek)} crimes : ${activatedWindows.length}`)

        // sort by number of crimes and get top 20 windows (HERE maps limitation)
        activatedWindows = activatedWindows.sort(windowCmp).reverse().slice(0,20)

        // Call python Script to display map
        printToMap(source,destination,queriedSquare,grid,activatedWindows);

        res.json(activatedWindows);
    })
})

async function getQueriedSquares(queriedSquare,dayOfWeek) {
    const restrictionLat = `BETWEEN ${queriedSquare.bottomLeft.lat} AND ${queriedSquare.topLeft.lat}`;
    const restrictionLong = `BETWEEN ${queriedSquare.topLeft.long} AND ${queriedSquare.topRight.long}`
    // grid element is between the queried square
    let q = `SELECT * FROM grid_${dayOfWeek.toLowerCase()} WHERE upper_left_lat ${restrictionLat} AND upper_left_long ${restrictionLong} AND lower_right_lat ${restrictionLat} AND lower_right_long ${restrictionLong}`;

    try {
        // Query precumpuded grid
        const squares = await db.any(q, [true]);
        // success
        return squares;
    } 
    catch(e) {
        // error
        console.log(e);
    }
}

// Takes database squares and cast them using 'Square' module
function castSquares(squares) {
    let grid = [];
    let totalNumOfCrimes = 0;
    //Comberting each grid element into squares by using module
    squares.forEach(sqr => {
        let Pi = {'lat': sqr.upper_left_lat , 'long': sqr.upper_left_long};
        let Pj = {'lat': sqr.lower_right_lat, 'long': sqr.lower_right_long};
        let sqrObj = new Square(Pi,Pj);
        sqrObj.numOfCrimes = sqr.number_of_crimes;
        totalNumOfCrimes += sqr.number_of_crimes;
        grid.push(sqrObj);
    });
    return grid;
}

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

// Compute the dimensions of queried Squared
function getQueriedSquare(bigSquare) {
    /*
        4 boxes (half a mile) radius for queried square
        Half a mile padding for each side
    */
    const biasedBoxes = 4; 
    const gridSquareSize = getGridSquareSize();
    return new Square(
        {
            'lat':  bigSquare.bottomLeft.lat-(biasedBoxes+1)*gridSquareSize, 
            'long': bigSquare.topLeft.long-(biasedBoxes+1)*gridSquareSize
        },
        {
            'lat':  bigSquare.topRight.lat+(biasedBoxes+1)*gridSquareSize, 
            'long': bigSquare.topRight.long+(biasedBoxes+1)*gridSquareSize
        }
    );
}

// Window comparison
function windowCmp(w1,w2) {
    let comparison = 0
    if(w1.numOfCrimes > w2.numOfCrimes){
        comparison = 1
    }
    else if(w1.numOfCrimes < w2.numOfCrimes) {
        comparison = -1
    }
    return comparison
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

app.listen(PORT, () => { console.log(`Running on port: ${PORT}`) });









