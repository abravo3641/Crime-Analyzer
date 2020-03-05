import sys, json, gmplot

def main():
    #Getting arguments from Node
    currentLocation, destinationLocation, bigSquare, grid, activatedWindows = getArguments()
    
    # Create map and center it base on your location
    gmap = gmplot.GoogleMapPlotter((currentLocation['lat']+destinationLocation['lat'])/2, (currentLocation['long']+destinationLocation['long'])/2, 15) 

    # Display current location
    drawPoint(gmap,currentLocation,'#00fff9',30)

    # Display destination location
    drawPoint(gmap,destinationLocation,'#00ff00',30)

    # display grid of sliding window
    drawGrid(gmap,grid,'black',2.5)

    # Draw the activated windows that passed thr
    drawActivatedWindows(gmap,activatedWindows,'#E3850D')

    # Draw Big Outer Box 
    drawSquareOutline(gmap,bigSquare,'cornflowerblue',2.5)

    # Write to the html path
    gmap.draw("./vizualization/file.html" ) 

def getArguments():
    currentLocation = json.loads(sys.argv[1])
    destinationLocation = json.loads(sys.argv[2])
    bigSquare = json.loads(sys.argv[3])
    grid = json.loads(sys.argv[4])
    activatedWindows = json.loads(sys.argv[5])
    return currentLocation,destinationLocation,bigSquare,grid,activatedWindows

def drawPoint(gmap,point,color,size):
    gmap.scatter([point['lat']],[point['long']], color, size, marker = False ) 

def drawSquareOutline(gmap,square,color,width):
    gmap.plot([square['topLeft']['lat'],square['topRight']['lat']],[square['topLeft']['long'],square['topRight']['long']],color, edge_width=width)
    gmap.plot([square['topRight']['lat'],square['bottomRight']['lat']],[square['topRight']['long'],square['bottomRight']['long']],color, edge_width=width)
    gmap.plot([square['bottomRight']['lat'],square['bottomLeft']['lat']],[square['bottomRight']['long'],square['bottomLeft']['long']],color, edge_width=width)
    gmap.plot([square['bottomLeft']['lat'],square['topLeft']['lat']],[square['bottomLeft']['long'],square['topLeft']['long']],color, edge_width=width)

def drawSquareFill(gmap,square,color):
    #[p1,p2,p3,p4,p1,p3,p2,p4]
    gmap.polygon([square['topLeft']['lat'],square['topRight']['lat'],square['bottomLeft']['lat'],square['bottomRight']['lat'],square['topLeft']['lat'],square['bottomLeft']['lat'],square['topRight']['lat'],square['bottomRight']['lat']],[square['topLeft']['long'],square['topRight']['long'],square['bottomLeft']['long'],square['bottomRight']['long'],square['topLeft']['long'],square['bottomLeft']['long'],square['topRight']['long'],square['bottomRight']['long']],color)

def drawGrid(gmap,grid,color,width):
    for square in grid:
        drawSquareOutline(gmap,square,color,width)

def drawActivatedWindows(gmap,activatedWindows,color):
    for square in activatedWindows:
        drawSquareFill(gmap,square,color)

#calling main
main()
