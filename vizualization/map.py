import sys, json, gmplot

def main():
    #Getting arguments from Node
    crimes, currentLocation, destinationLocation, window, grid = getArguments()
    
    #List of lat and long for all crimes
    latitude_list, longitude_list = getCrimeList(crimes)

    # Create gmap and center it on Manhattan
    gmap = gmplot.GoogleMapPlotter(40.760292, -73.996129, 13 ) 

    # Currenlt and destination location coordinates
    currentL = [currentLocation['lat'],currentLocation['long']]
    destinationL = [destinationLocation['lat'],destinationLocation['long']]

    #Display current location
    gmap.scatter([currentL[0]],[currentL[1]], '#00fff9', size = 30, marker = False ) 

    #Display destination location
    gmap.scatter([destinationL[0]],[destinationL[1]], '#00ff00', size = 30, marker = False ) 

    # display the crimes to the map
    gmap.scatter( latitude_list, longitude_list, '#ff0000', size = 10, marker = False ) 

    # display initial position of sliding window on the map
    # drawSlidingWindow(gmap,window)

    # display grid of sliding window
    drawGrid(gmap,grid)

    # Draw Big Box 
    drawBigBox(gmap, currentL, destinationL)

    # Write to the html path
    gmap.draw("./vizualization/file.html" ) 


def getArguments():
    crimes = json.loads(sys.argv[1])
    currentLocation = json.loads(sys.argv[2])
    destinationLocation = json.loads(sys.argv[3])
    window = json.loads(sys.argv[4])
    grid = json.loads(sys.argv[5])
    return crimes,currentLocation,destinationLocation,window,grid

def getCrimeList(crimes):
    latitude_list = []
    longitude_list = []
    for crime in crimes:
        latitude_list.append(crime['latitude'])
        longitude_list.append(crime['longitude'])

    return latitude_list,longitude_list

def drawBigBox(gmap,currentL,destinationL): 
    gmap.plot([currentL[0],destinationL[0]],[currentL[1],currentL[1]],'cornflowerblue', edge_width = 2.5) 
    gmap.plot([currentL[0],currentL[0]],[currentL[1],destinationL[1]],'cornflowerblue', edge_width = 2.5) 
    gmap.plot([destinationL[0],destinationL[0]],[destinationL[1],currentL[1]],'cornflowerblue', edge_width = 2.5) 
    gmap.plot([destinationL[0],currentL[0]],[destinationL[1],destinationL[1]],'cornflowerblue', edge_width = 2.5) 

def drawSlidingWindow(gmap,window):
    #Display four points
    gmap.plot([window['p1']['lat'],window['p2']['lat']],[window['p1']['long'],window['p2']['long']],'black', edge_width = 3.5)
    gmap.plot([window['p2']['lat'],window['p4']['lat']],[window['p2']['long'],window['p4']['long']],'black', edge_width = 3.5)
    gmap.plot([window['p4']['lat'],window['p3']['lat']],[window['p4']['long'],window['p3']['long']],'black', edge_width = 3.5)
    gmap.plot([window['p3']['lat'],window['p1']['lat']],[window['p3']['long'],window['p1']['long']],'black', edge_width = 3.5)


def drawGrid(gmap,grid):
    for window in grid:
        gmap.plot([window['p1']['lat'],window['p2']['lat']],[window['p1']['long'],window['p2']['long']],'black', edge_width = 2.5)
        gmap.plot([window['p2']['lat'],window['p4']['lat']],[window['p2']['long'],window['p4']['long']],'black', edge_width = 2.5)
        gmap.plot([window['p4']['lat'],window['p3']['lat']],[window['p4']['long'],window['p3']['long']],'black', edge_width = 2.5)
        gmap.plot([window['p3']['lat'],window['p1']['lat']],[window['p3']['long'],window['p1']['long']],'black', edge_width = 2.5)


#calling main
main()
