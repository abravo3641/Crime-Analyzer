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

        // Call python Script to display map
        printToMap(crimes,currentLocation,destinationLocation);
        
        res.send('done!');
    });

})

function printToMap(crimes, currentLocation, destinationLocation) {
    const {spawn} = require("child_process");
    const pythonProcess = spawn('python',["./vizualization/map.py",JSON.stringify(crimes),JSON.stringify(currentLocation),JSON.stringify(destinationLocation)]);
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
