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
	"html/template"
	"net/http"

	"google.golang.org/appengine"
)

const assetURL = "some/path/here/%s.png"

func main() {
	defaultTags := &OgTags{
		Tags: []OgTag{
			OgTag{Key: "og:image", Value: "https://storage.googleapis.com/gweb-showcase.appspot.com/pi-share.png"},
			OgTag{Key: "og:image:secure_url", Value: "https://storage.googleapis.com/gweb-showcase.appspot.com/pi-share.png"},
		},
	}

	http.HandleFunc("/experiment/pi/", func(w http.ResponseWriter, r *http.Request) {
		t, _ := template.ParseFiles("index.html")
		t.Execute(w, defaultTags)
	})

	appengine.Main()
}

// OgTags is a collection of og:tags to be injected into the DOM
type OgTags struct {
	Tags []OgTag
}

// OgTag is a single key value pair
type OgTag struct {
	Key   string
	Value string
}
