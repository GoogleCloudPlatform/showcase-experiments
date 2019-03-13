# Collect all images from Pizza Places

This file creates an executable that will pull down all images for a restaurant
in the search radius. It takes the following inputs:

-key     Maps API Key
-lat     Search Latitude
-lng     Search Longitude
-radius  The radius around the lat/lng point to search
-keyword The term to search for. 


The command I used to create the initial set of images was this:

`go run main.go -key $PIZZA_API_KEY -lat 40.758896 -lng -73.985130 -keyword pizza`

This will source a pizza places in New York, NY.