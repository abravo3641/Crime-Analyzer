const Square = require('./square')

class Grid {
    constructor(activatedWindows) {
        this.size = 0.0018; //size of each square in degrees
        this.bigSquare = new Square({lat: 40.677162, long:-74.039831},{lat: 40.889096,long:-73.894479}); //Giant outer square for manhattan
        this.grid = this.gridMaker(activatedWindows)
        this.postGrid = [] // This is the grid after adjacent squares have been merged
    }

    gridMaker(activatedWindows){
        let grid = []

        //Initialize top left square
        let slidingWindow = this.constructWindow()
        let {topLeft,topRight,bottomLeft,bottomRight} = slidingWindow;

        //Dimensions of smaller square
        const {length,width} = slidingWindow.getDimensions();
        let i = 0
        //Still inside of the big square
        while(topLeft.lat.toFixed(8) > this.bigSquare.bottomLeft.lat.toFixed(8)) {
            grid.push([])
            while(Math.abs(topLeft.long.toFixed(8)) > Math.abs(this.bigSquare.topRight.long.toFixed(8))) {
                //Check if window is overFlowed on long
                if(Math.abs(topRight.long.toFixed(8)) < Math.abs(this.bigSquare.topRight.long.toFixed(8))) {
                    break;
                }

                let slidingWindowClone = slidingWindow.clone();
                slidingWindowClone.active = false; 

                // see if it is in activated windows
                for(let k=0; k<activatedWindows.length; k++) {
                    if(activatedWindows[k].isEqual(slidingWindowClone)) {
                        slidingWindowClone.active = true;
                        slidingWindowClone.numOfCrimes = activatedWindows[k].numOfCrimes;
                        break;
                    }
                }
                

                //Copy the points and put then on the grid to save 
                grid[i].push(slidingWindowClone);
                //Move sliding window to the right
                topLeft.long += width;
                topRight.long += width;
                bottomLeft.long += width;
                bottomRight.long += width;

            }

            //Reset square back to the left and update latitude(move sliding window down)
            topLeft.long = bottomLeft.long = this.bigSquare.topLeft.long;
            topRight.long = bottomRight.long = topLeft.long + width;
            topLeft.lat  = topRight.lat  = topLeft.lat - length;
            bottomLeft.lat  = bottomRight.lat  = bottomLeft.lat - length;
            i++;
            //Check if window is overFlowed on lat
            if(bottomLeft.lat < this.bigSquare.bottomLeft.lat) {
                break; 
            }

        }
        return grid;
    }

    constructWindow() {
        const {topLeft} = this.bigSquare;
        let p1 = {lat:topLeft.lat,long:topLeft.long};
        let p2 = {lat:topLeft.lat-this.size,long:topLeft.long+this.size};
        return new Square(p1,p2);
    }

    // Keep getting the maximum ractangle and updating grid
    maximumlRectangles() {
        let coor = this.maximumRectangle();

        //repeat process until no more maximum rectangles could be made
        while (coor.length != 0) {
            this.updateGrid(coor); //Update grid by deactivating windows that were merged 
            coor = this.maximumRectangle(); //call the next largest rectangle after deactivating previous
            
        }
    }

    // Get the largest rectangular possible by connecting adjacent grid elements
    maximumRectangle() {
        if(this.grid.length == 0){
            return 0;
            }
            const m = this.grid.length, n = this.grid[0].length;
            
            let maxArea = 0;
            let coordinates = {topLeft:'',topRight:'', bottomLeft:'', bottomRight:'', length:0, width:0};
            let histo = new Array(n).fill(0)
            
            for(let r=0; r<m; r++) {
                for(let c=0; c<n; c++) {
                    //Update histogram
                    histo[c] = (this.grid[r][c].active)? histo[c] + 1 : 0;
                }
                //update maxArea with the maximum area from this row's histogram
                let histoMaxArea, start, length;
                [histoMaxArea, start, length] = this.max_square_histo(histo)
            
                if (histoMaxArea > maxArea) {
                    maxArea = histoMaxArea
                    let width = histoMaxArea / length
                    
                    coordinates.topLeft = [r-width+1,start]
                    coordinates.topRight = [r-width+1,start+length-1]
                    coordinates.bottomRight = [r,start+length-1]
                    coordinates.bottomLeft = [r,start]
                    coordinates.length = length
                    coordinates.width = width
                }     
            }
            return coordinates;
    }

    max_square_histo(heights) {
        let maxArea = 0;
        const n = heights.length;

        let left = 0, right = 0;

        for(let i=0; i<n; i++) {
            let runningMin = Number.MAX_VALUE;
            for(let j=i; j<n; j++) {
                runningMin = Math.min(runningMin,heights[j]);
                let currentArea = runningMin*(j-i+1)
                if(currentArea > maxArea) {
                left = i;
                right = j;
                maxArea = currentArea;
                }

            }
        }
        let l = right - left + 1 //length of square
        return [maxArea,left,l];
    }

    //Deactivate windows that coor points to
    updateGrid(coor){
        const {topLeft,topRight,bottomLeft,bottomRight} = coor
        let totalNumOfCrimes = 0; //amount of crimes in packaged square
        let count = 0;
        for(let r=topLeft[0]; r<=bottomLeft[0]; r++) {
            for(let c=topLeft[1]; c<=topRight[1]; c++) {
                this.grid[r][c].active = false
                totalNumOfCrimes += this.grid[r][c].numOfCrimes
                count++;
            }
        }
        // Making square from topleft and bottom right point
        const sqr = new Square(this.grid[topLeft[0]][topLeft[1]].topLeft,this.grid[bottomRight[0]][bottomRight[1]].bottomRight);
        sqr.numOfCrimes = totalNumOfCrimes/count;
        this.postGrid.push(sqr)        
    }

}

module.exports = Grid
