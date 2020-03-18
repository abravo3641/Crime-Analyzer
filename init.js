//Populate Database with prefilled grid

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


//Entry point to program
function init() {
    //Square that encloses all of manhattan borough
    let bigSquare = new Square({lat: 40.677162, long:-74.039831},{lat: 40.889096,long:-73.894479});
    let grid = constructGrid(bigSquare);
    
    //make crime grid and save to DB: Uncoment to fill DB 
    // constructCrimeGrid(grid); 

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
function constructCrimeGrid(grid) {
    for(let i=0; i<grid.length; i++) {
        let q = `SELECT COUNT(*) as count FROM nyCrime WHERE latitude BETWEEN ${grid[i].lowerLeft.lat} AND ${grid[i].upperLeft.lat} AND longitude BETWEEN ${grid[i].upperLeft.long} AND ${grid[i].upperRight.long}`;
        connection.query(q, (err,res) => {
            console.log(`Getting Number of crimes inside sqr #${i}`)
            if(err) throw new Error;
            const numOfCrimes = res[0].count;

            //Check that there are crimes before saving square
            if(numOfCrimes != 0) {
                grid[i].numOfCrimes = numOfCrimes;
                //Save Crime square to DB
                saveSquare(grid[i]);

            }
        }) 
    }

    function saveSquare(square) {
        //Getting it into the correct format for mysql
        let sqr = {
            upper_left_lat: square.upperLeft.lat,
            upper_left_long: square.upperLeft.long,
            lower_right_lat: square.lowerRight.lat,
            lower_right_long: square.lowerRight.long,
            number_of_crimes: square.numOfCrimes
        }; 

        connection.query('INSERT INTO Grid SET ?',sqr,(err,results,fields) => {
            if(err) throw err;
        });
    }

}

function printToMap(...arg) {
    const {spawn} = require("child_process");
    //JSON array that we will pass to python process
    let arr = arg.map(obj => JSON.stringify(obj));
    const pythonProcess = spawn('python',["./vizualization/map.py",...arr]);    
}



app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    init();
})