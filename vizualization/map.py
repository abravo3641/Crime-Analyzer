import sys, json, gmplot

def main():
    #Getting arguments from Node
    crimes, currentLocation, destinationLocation = getArguments()
    
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

    # Draw Box 
    drawBox(gmap, currentL, destinationL)

    # display the crimes to the map
    gmap.scatter( latitude_list, longitude_list, '#ff0000', size = 10, marker = False ) 

    # Write to the html path
    gmap.draw("./vizualization/file.html" ) 


def getArguments():
    crimes = json.loads(sys.argv[1])
    currentLocation = json.loads(sys.argv[2])
    destinationLocation = json.loads(sys.argv[3])
    return crimes,currentLocation,destinationLocation

def getCrimeList(crimes):
    latitude_list = []
    longitude_list = []
    for crime in crimes:
        latitude_list.append(crime['latitude'])
        longitude_list.append(crime['longitude'])

    return latitude_list,longitude_list

def drawBox(gmap,currentL,destinationL): 
    gmap.plot([currentL[0],destinationL[0]],[currentL[1],currentL[1]],'cornflowerblue', edge_width = 2.5) 
    gmap.plot([currentL[0],currentL[0]],[currentL[1],destinationL[1]],'cornflowerblue', edge_width = 2.5) 
    gmap.plot([destinationL[0],destinationL[0]],[destinationL[1],currentL[1]],'cornflowerblue', edge_width = 2.5) 
    gmap.plot([destinationL[0],currentL[0]],[destinationL[1],destinationL[1]],'cornflowerblue', edge_width = 2.5) 

#calling main
main()
