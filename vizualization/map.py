import sys, json, gmplot

def main():
    #Getting arguments from Node
    crimes, currentLocation, destinationLocation, bigSquare, grid = getArguments()
    
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

    # Draw Big Outer Box 
    drawSquare(gmap,bigSquare,'cornflowerblue',2.5)

    # Write to the html path
    gmap.draw("./vizualization/file.html" ) 


def getArguments():
    crimes = json.loads(sys.argv[1])
    currentLocation = json.loads(sys.argv[2])
    destinationLocation = json.loads(sys.argv[3])
    bigSquare = json.loads(sys.argv[4])
    grid = json.loads(sys.argv[5])
    return crimes,currentLocation,destinationLocation,bigSquare,grid    

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

def drawSquare(gmap,square,color,width):
    gmap.plot([square['p1']['lat'],square['p2']['lat']],[square['p1']['long'],square['p2']['long']],color, edge_width=width)
    gmap.plot([square['p2']['lat'],square['p4']['lat']],[square['p2']['long'],square['p4']['long']],color, edge_width=width)
    gmap.plot([square['p4']['lat'],square['p3']['lat']],[square['p4']['long'],square['p3']['long']],color, edge_width=width)
    gmap.plot([square['p3']['lat'],square['p1']['lat']],[square['p3']['long'],square['p1']['long']],color, edge_width=width)

def drawGrid(gmap,grid,color,width):
    for square in grid:
        drawSquare(gmap,square,color,width)

#calling main
main()
