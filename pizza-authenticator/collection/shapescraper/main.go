// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"flag"
	"log"

	"github.com/tpryan/mapsphotos"

	"googlemaps.github.io/maps"
)

func main() {
	excludes := []string{"Pizza Hut", "Domino's", "Papa John's", "Sbarro", "Little Ceasar", "California Pizza Kitchen", "Chuck E. Cheese's", "Uno", "Godfather's Pizza"}

	lat := flag.Float64("lat", 0, "Latitude to search")
	lng := flag.Float64("lng", 0, "Longitude to search")
	key := flag.String("key", "", "Maps API key")
	radius := flag.Int64("radius", 3000, "Search Radius to use")
	keyword := flag.String("keyword", "", "Keywoard to pass to search")
	flag.Parse()

	if *key == "" {
		log.Fatalf("must pass in a valid Maps API key")
	}

	c, err := maps.NewClient(maps.WithAPIKey(*key))
	if err != nil {
		log.Fatalf("fatal error: %s", err)
	}

	l := &maps.LatLng{Lat: *lat, Lng: *lng}

	r := &maps.NearbySearchRequest{
		Location: l,
		Radius:   uint(*radius),
		Keyword:  *keyword,
	}

	if err := mapsphotos.Gather(c, r, "images/", excludes, []string{}); err != nil {
		log.Fatalf("fatal error in nearby search: %s", err)
	}

}
