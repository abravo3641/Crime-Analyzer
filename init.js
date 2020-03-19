//Populate Database with prefilled grid

const express = require('express');
const bodyParser = require('body-parser');
const pgb = require('pg-promise')();
const app = express();

require('dotenv').config(); // Lets us use the env file

const { PORT, DB_HOST, DB_PORT ,DB_USER, DB_PASS, DB_DATABASE } = process.env;

//Module needed
const Square = require('./crimeAnalyzerModules/square')


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


//Entry point to program
function init() {
    //Square that encloses all of manhattan borough
    let bigSquare = new Square({lat: 40.677162, long:-74.039831},{lat: 40.889096,long:-73.894479});
    let grid = constructGrid(bigSquare);
    
    //make crime grid and save to DB: Uncoment to fill DB 
    // constructCrimeGrid(grid)

    //printToMap({},{lat: 40.677162, long:-74.039831},{lat: 40.879096,long:-73.904479},bigSquare,grid,{})  
}


function constructGrid(bigSquare) {
    let grid = [];

    let slidingWindow = constructWindow(bigSquare);

    let {upperLeft,upperRight,lowerLeft,lowerRight} = slidingWindow;
    
    //Dimensions of smaller square
    const {length,width} = slidingWindow.getDimensions();

    //Still inside of the big square
    while(upperLeft.lat.toFixed(8) > bigSquare.lowerLeft.lat.toFixed(8)) {
        
        while(Math.abs(upperLeft.long.toFixed(8)) > Math.abs(bigSquare.upperRight.long.toFixed(8))) {
            //Check if window is overFlowed on long
            if(Math.abs(upperRight.long.toFixed(8)) < Math.abs(bigSquare.upperRight.long.toFixed(8))) {
                break;
            }

            let slidingWindowClone = slidingWindow.clone();

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
            break; 
        }

    }
    console.log(grid.length)
    return grid;
}


function constructWindow(bigSquare) {
    const size = getSize();
    const {upperLeft} = bigSquare;
    let p1 = {lat:upperLeft.lat,long:upperLeft.long};
    let p2 = {lat:upperLeft.lat-size,long:upperLeft.long+size};
    return new Square(p1,p2);
}


function getSize() {
    const size = 0.0018;
    //Returns the dimensions of grid square in (lat,long) difference
    console.log(`Each grid square has a dimension of width and length of: ${measure(0,0,0,size).toFixed(0)} meters`)
    return size;
}

// Converts lat/long distance to meters 
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

//Takes each grid square and finds the number of crimes in each square and saves it to DB
async function constructCrimeGrid(grid) {
    for(let i=0; i<grid.length; i++) {
        let q = `SELECT COUNT(*) as count FROM ny_crime_manhattan WHERE latitude BETWEEN ${grid[i].lowerLeft.lat} AND ${grid[i].upperLeft.lat} AND longitude BETWEEN ${grid[i].upperLeft.long} AND ${grid[i].upperRight.long}`;
        const res = await db.any(q,)
        console.log(`Getting Number of crimes inside sqr #${i}`)
        const numOfCrimes = res[0].count;

        //Check that there are crimes before saving square
        if(numOfCrimes != 0) {
            grid[i].numOfCrimes = numOfCrimes;
            //Save Crime square to DB
            saveSquare(grid[i]);
        }
        
    }

    function saveSquare(square) {
        const {upperLeft,lowerRight,numOfCrimes} = square;
        const q = 'INSERT INTO grid(upper_left_lat, upper_left_long, lower_right_lat, lower_right_long, number_of_crimes) VALUES($1, $2, $3, $4, $5)';
        const values = [upperLeft.lat,upperLeft.long,lowerRight.lat,lowerRight.long,numOfCrimes];

        db.none(q, values)
        .catch(error => {
            console.log(error);
        });

    }

}

function printToMap(...arg) {
    const {spawn} = require("child_process");
    //JSON array that we will pass to python process
    let arr = arg.map(obj => JSON.stringify(obj));
    const pythonProcess = spawn('python',["./vizualization/map.py",...arr]);    
}



app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    init();
})
