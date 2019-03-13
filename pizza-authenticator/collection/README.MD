# Pizza Authenticator - Data Collection

This folder has all of the components for collecting the data that was used
to train the pizza authenticator model. In order to train a model for analyizing
pizza we had to source a large amount of images of Pizza.  This took 2 steps:

1. Get a semi large set of data consisting of images of pizza and not pizza. 
This was used to create a Pizza/NotPizza ML model. Technically, I suppose this 
is a pie/slice/notpizza model, but functionally, I use it as Pizza/NotPizza, and 
that is funnier. This is used in the second step to speed up the sorting of a 
larger set of pizza images. 
1. Get a large set of data consisting of images that was sorted by city in which
the pizza was made.  It also pulls out national chain pizza places, so as to 
not treat the nationwide chains like just any other pizza place. 

Despite the automation I added to this process, you will still be looking 
**lots** of pictures of pizza. 


TODO: Outline the steps needed to get credentials



## Steps
1. Get an api key for Places
1. Run code in shapescaper  
    `go run main.go -key $PIZZA_API_KEY -lat 40.758896 -lng -73.985130 -keyword pizza`
1. Manually sort the images into three categories
    1. pie
    1. slice
    1. notpizza
1. Upload pictures to AutoML being careful to label images:
    1. pie
    1. slice
    1. notpizza
1. Train AutoML on that dataset
1. Take note of the endpoint for the AutoML model that is made
    
**Note:** This will create a model that you use in the second step.   

1. Get an API credentials for AutoML
1. Run code in cityscraper  
`go run main.go `
1. Manually check all of the images to make sure that they sorted correctly
    there will most likely be images that don't get through the process. Sort
    them into the respective folder under the geographic folder name
1. Upload only pictures of pie and slices to AutoML being careful to label 
    images:
        1. CHI
        1. NYC
        1. SF
        1. National
1. Train AutoML on that dataset