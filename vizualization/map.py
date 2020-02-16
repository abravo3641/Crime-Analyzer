import sys, json, gmplot

def main():
    #Getting arguments from Node
    crimes, currentLocation, destinationLocation, bigSquare, grid, activatedWindows = getArguments()
    
    # Create map and center it base on your location
    gmap = gmplot.GoogleMapPlotter((currentLocation['lat']+destinationLocation['lat'])/2, (currentLocation['long']+destinationLocation['long'])/2, 15) 

    # Display current location
    drawPoint(gmap,currentLocation,'#00fff9',30)

    # Display destination location
    drawPoint(gmap,destinationLocation,'#00ff00',30)

    # Display the crimes to the map
    drawCrimes(gmap,crimes,'#ff0000',10)

    # display grid of sliding window
    drawGrid(gmap,grid,'black',2.5)

    # Draw the activated windows that passed thr
    drawActivatedWindows(gmap,activatedWindows,'#E3850D')

    # Draw Big Outer Box 
    drawSquareOutline(gmap,bigSquare,'cornflowerblue',2.5)

    # Write to the html path
    gmap.draw("./vizualization/file.html" ) 


def getArguments():
    crimes = json.loads(sys.argv[1])
    currentLocation = json.loads(sys.argv[2])
    destinationLocation = json.loads(sys.argv[3])
    bigSquare = json.loads(sys.argv[4])
    grid = json.loads(sys.argv[5])
    activatedWindows = json.loads(sys.argv[6])
    return crimes,currentLocation,destinationLocation,bigSquare,grid,activatedWindows

def drawCrimes(gmap,crimes,color,size):
    #List of lat and long for all crimes
    latitude_list = []
    longitude_list = []
    for crime in crimes:
        latitude_list.append(crime['latitude'])
        longitude_list.append(crime['longitude'])

    gmap.scatter( latitude_list, longitude_list, color, size, marker = False ) 

def drawPoint(gmap,point,color,size):
    gmap.scatter([point['lat']],[point['long']], color, size, marker = False ) 

def drawSquareOutline(gmap,square,color,width):
    gmap.plot([square['upperLeft']['lat'],square['upperRight']['lat']],[square['upperLeft']['long'],square['upperRight']['long']],color, edge_width=width)
    gmap.plot([square['upperRight']['lat'],square['lowerRight']['lat']],[square['upperRight']['long'],square['lowerRight']['long']],color, edge_width=width)
    gmap.plot([square['lowerRight']['lat'],square['lowerLeft']['lat']],[square['lowerRight']['long'],square['lowerLeft']['long']],color, edge_width=width)
    gmap.plot([square['lowerLeft']['lat'],square['upperLeft']['lat']],[square['lowerLeft']['long'],square['upperLeft']['long']],color, edge_width=width)

def drawSquareFill(gmap,square,color):
    #[p1,p2,p3,p4,p1,p3,p2,p4]
    gmap.polygon([square['upperLeft']['lat'],square['upperRight']['lat'],square['lowerLeft']['lat'],square['lowerRight']['lat'],square['upperLeft']['lat'],square['lowerLeft']['lat'],square['upperRight']['lat'],square['lowerRight']['lat']],[square['upperLeft']['long'],square['upperRight']['long'],square['lowerLeft']['long'],square['lowerRight']['long'],square['upperLeft']['long'],square['lowerLeft']['long'],square['upperRight']['long'],square['lowerRight']['long']],color)

def drawGrid(gmap,grid,color,width):
    for square in grid:
        drawSquareOutline(gmap,square,color,width)

def drawActivatedWindows(gmap,activatedWindows,color):
    for square in activatedWindows:
        drawSquareFill(gmap,square,color)

#calling main
main()
