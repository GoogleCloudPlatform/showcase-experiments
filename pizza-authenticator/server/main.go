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
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"image"
	"image/jpeg"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/nfnt/resize"
	uuid "github.com/satori/go.uuid"
	"golang.org/x/oauth2/google"
	cloudkms "google.golang.org/api/cloudkms/v1"
	"google.golang.org/appengine" // Required external App Engine library
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/file"
	"google.golang.org/appengine/log"
)

const modelAppEngineID = "automlvisiontest-214720"
const publicStorageURL = "https://storage.googleapis.com/%s/%s"
const publicMLURL = "https://automl.googleapis.com/v1beta1/projects/%s/locations/%s/models/%s:predict"

var shapeModel string
var authmodel string
var region string
var shapeModelURL string
var authModelURL string
var oauthClient *http.Client

func main() {
	shapeModel = os.Getenv("SHAPE_MODEL")
	authmodel = os.Getenv("AUTH_MODEL")
	region = os.Getenv("REGION")

	http.HandleFunc(fullRoute("/api/warm-up/"), warmupHandler)
	http.HandleFunc(fullRoute("/api/result/"), resultHandler)
	http.HandleFunc(fullRoute("/api/evaluate/"), imageHandler)
	http.HandleFunc(fullRoute("/"), indexHandler)

	appengine.Main() // Starts the server to receive requests
}

func fullRoute(route string) string {
	return fmt.Sprintf("/experiment/pizza-authenticator%s", route)
}

func warmupHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	log.Infof(ctx, "Warming called")
	shapeModelURL = fmt.Sprintf(publicMLURL, modelAppEngineID, region, shapeModel)
	authModelURL = fmt.Sprintf(publicMLURL, modelAppEngineID, region, authmodel)

	var err error
	var image []byte
	var _ interface{}

	image, err = ioutil.ReadFile("./warm-up.jpg")
	if err != nil {
		sendText(w, fmt.Sprintf(`"couldn't get image: %s"`, err), http.StatusInternalServerError)
		return
	}

	oauthClient, err = google.DefaultClient(ctx, cloudkms.CloudPlatformScope)
	if err != nil {
		sendText(w, fmt.Sprintf(`"couldn't get client: %s"`, err), http.StatusInternalServerError)
		return
	}

	message := ""
	payload, err := isPizza(image)
	if err != nil {
		if strings.Index(err.Error(), "needs to be warmed up") >= 0 {
			sendText(w, fmt.Sprintf(`"could not use IsPizza: %s"`, err), http.StatusInternalServerError)
			return
		}
		message += "IsPizza warming "
		log.Warningf(ctx, fmt.Sprintf(`"IsPizza warming: %v"`, payload))

	}

	payload, err = authPizza(image)
	if err != nil {
		if strings.Index(err.Error(), "needs to be warmed up") >= 0 {
			sendText(w, fmt.Sprintf(`"could not use authPizza %s"`, err), http.StatusInternalServerError)
			return
		}
		message += "authPizza warming "
		log.Warningf(ctx, fmt.Sprintf(`"AuthPizza warming: %v"`, payload))
	}

	log.Infof(ctx, "Warming complete")
	sendText(w, fmt.Sprintf(`ok %s`, message), http.StatusOK)
}

// Handles all top level requests but simply responding with the frontend entry point.
func indexHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		sendJSON(w, `{"error": "method not allowed"}`, http.StatusNotFound)
	}

	ctx := appengine.NewContext(r)
	t, _ := template.ParseFiles("index.html")

	var vars templateVars
	var imageURL string

	// If we are on a result page, we need to inject the correct og-tags. This might be a
	// social media bot, coming for a previously scanned pizza.
	if strings.HasPrefix(r.URL.Path, fullRoute("/result/")) {
		id := strings.Split(r.URL.Path, "/")[4]
		if id == "" {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}

		bucket, _ := file.DefaultBucketName(ctx)
		imageURL = fmt.Sprintf(publicStorageURL, bucket, id+"-result.png")
	} else {
		imageURL = "https://storage.googleapis.com/gweb-showcase.appspot.com/pizza-share.png"
	}

	vars = templateVars{
		URL: fmt.Sprintf("https://%s%s", r.Host, r.URL.Path),
		Tags: []tag{
			tag{Key: "og:image", Value: imageURL},
			tag{Key: "og:image:secure_url", Value: imageURL},
			tag{Key: "og:image:width", Value: "1200"},
			tag{Key: "og:image:height", Value: "630"},
		},
	}

	t.Execute(w, vars)
}

// Handles the storage of sharable assets. This route expects an ID which will be used as the
// name for the asset. The route has look like /api/result/:id where id represents any string.
// However the id should be equivalent to the id returned from the original evaluation.
// The only allowed method is POST. The image to be stored has to be shipped in form-data under
// the variable name "image".
func resultHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendJSON(w, `{"error": "method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")

	if len(parts) != 6 {
		sendJSON(w, `{"error": "page not found"}`, http.StatusNotFound)
		return
	}

	ctx := appengine.NewContext(r)
	id := parts[5]

	f, fh, err := extractImage(r)
	if err != nil {
		sendError(w, err)
	}

	oauthClient, err = google.DefaultClient(ctx, cloudkms.CloudPlatformScope)
	if err != nil {
		sendError(w, err)
	}

	url, err := saveToGCS(ctx, f, fh, fmt.Sprintf("%s-result", id))
	if err != nil {
		sendError(w, err)
		return
	}

	result := &resultImageResponse{URL: url}
	resultJSON, err := json.Marshal(result)

	sendJSON(w, string(resultJSON), http.StatusOK)
}

// Handles POST and GET requests.
//
// GET request will check a given id past as api/evaluation/:id
// against the datastore and returns a previously evaluated result.
//
// POST requests evaluate an image against both a pizza/not-pizza model determining if the picture contains
// pizza at all. If so it evaluates it against 3 different types.
// The images has to be transported in a POST request within form-data under the variable "image".
func imageHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	shapeModelURL = fmt.Sprintf(publicMLURL, modelAppEngineID, region, shapeModel)
	authModelURL = fmt.Sprintf(publicMLURL, modelAppEngineID, region, authmodel)

	if r.Method == "GET" {
		parts := strings.Split(r.URL.Path, "/")

		if len(parts) != 6 {
			sendJSON(w, `{"error": "page not found"}`, http.StatusNotFound)
			return
		}

		id := parts[5]

		var entity EvaluationEntity
		key := datastore.NewKey(ctx, "EvaluationEntity", id, 0, nil)
		err := datastore.Get(ctx, key, &entity)

		if err != nil {
			sendJSON(w, fmt.Sprintf(`{"error": "%s"}`, err), http.StatusNotFound)
			return
		}

		sendJSON(w, entity.JSON, http.StatusOK)

	} else if r.Method == "POST" {
		id := generateID()

		ul, _, err := extractImage(r)
		if err != nil {
			sendError(w, err)
			return
		}

		f, err := shrinkImage(ul)
		if err != nil {
			sendError(w, err)
			return
		}

		ctxDeadline, _ := context.WithTimeout(ctx, 1*time.Minute)
		oauthClient, err = google.DefaultClient(ctxDeadline, cloudkms.CloudPlatformScope)
		if err != nil {
			sendError(w, err)
		}

		qr := &queryResult{ID: id}

		pizzaIsScores, err := isPizza(f)
		if err != nil {
			log.Errorf(ctx, fmt.Sprintf("IsPizza failed: %s \n", err))
			sendError(w, err)
			return
		}

		qr.IsPizza = pizzaIsScores.Payload

		pizzaAuthScores, err := authPizza(f)
		if err != nil {
			log.Errorf(ctx, fmt.Sprintf("AuthPizza failed: %s \n", err))
			sendError(w, err)
			return
		}

		qr.PizzaAuth = pizzaAuthScores.Payload

		response, err := json.Marshal(qr)
		if err != nil {
			sendError(w, err)
			return
		}

		err = saveToDatastore(ctx, id, string(response))
		if err != nil {
			sendError(w, err)
			return
		}

		sendJSON(w, string(response), http.StatusOK)

	} else {
		sendJSON(w, `{"error": "method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func shrinkImage(f []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(f))

	if err != nil {
		return nil, err
	}

	newImage := resize.Resize(500, 0, img, resize.Lanczos3)
	buf := new(bytes.Buffer)
	err = jpeg.Encode(buf, newImage, nil)
	return buf.Bytes(), nil
}

func extractImage(r *http.Request) ([]byte, *multipart.FileHeader, error) {
	// ctx := appengine.NewContext(r)
	f, fh, err := r.FormFile("image")
	if err == http.ErrMissingFile {
		return nil, nil, errors.New("upload file missing: " + err.Error())
	}
	if err != nil {
		return nil, nil, errors.New("upload other issue: " + err.Error())
	}
	defer f.Close()
	bytes, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, nil, errors.New("upload read error: " + err.Error())
	}

	// img, _, err := image.Decode(f)
	// if err != nil {
	// 	return nil, nil, errors.New("upload read error: " + err.Error())
	// }

	// newImage := resize.Resize(500, 0, img, resize.Lanczos3)
	// buf := new(bytes.Buffer)
	// err = jpeg.Encode(buf, newImage, nil)
	if err != nil {
		return nil, nil, errors.New("resize error: " + err.Error())
	}
	// log.Infof(ctx, fmt.Sprintf("we encoded the image %v", newImage))

	return bytes, fh, nil
	// return buf.Bytes(), fh, nil
}

func saveToGCS(ctx context.Context, f []byte, fh *multipart.FileHeader, id string) (url string, err error) {

	// random filename, retaining existing extension.
	name := id + path.Ext(fh.Filename)
	bucket, err := file.DefaultBucketName(ctx)
	if err != nil {
		return "", errors.New("cloudstorage " + bucket + " defaultbucket: " + err.Error())
	}

	client, err := storage.NewClient(ctx)
	if err != nil {
		return "", errors.New("cloudstorage " + bucket + " client: " + err.Error())
	}
	sb := client.Bucket(bucket)

	w := sb.Object(name).NewWriter(ctx)
	w.ACL = []storage.ACLRule{{Entity: storage.AllUsers, Role: storage.RoleReader}}
	w.ContentType = fh.Header.Get("Content-Type")
	w.CacheControl = "public, max-age=86400"

	if _, err := io.Copy(w, bytes.NewReader(f)); err != nil {
		return "", errors.New("cloudstorage " + bucket + " write: " + err.Error())
	}
	if err := w.Close(); err != nil {
		return "", errors.New("cloudstorage " + bucket + " close: " + err.Error())
	}

	return fmt.Sprintf(publicStorageURL, bucket, name), nil
}

// EvaluationEntity is a model for storing the result of an evaluation request.
type EvaluationEntity struct {
	JSON string
}

func saveToDatastore(ctx context.Context, id, content string) error {
	entry := &EvaluationEntity{JSON: content}
	key := datastore.NewKey(ctx, "EvaluationEntity", id, 0, nil)

	if _, err := datastore.Put(ctx, key, entry); err != nil {
		return err
	}

	return nil
}

func isPizza(f []byte) (*response, error) {
	scores := &response{}

	req := &request{}
	req.Payload.Image.Bytes = f
	j, err := json.Marshal(req)
	if err != nil {
		return scores, fmt.Errorf("coudn't create json: %s", err)
	}

	res, code, err := modelCall(shapeModelURL, "POST", j)

	if err != nil {
		return scores, fmt.Errorf("error calling model: %d, %s", code, err)
	}

	if err := json.Unmarshal(res, &scores); err != nil {
		return scores, fmt.Errorf("error marshaling json: %d, %s", code, err)
	}

	return scores, nil
}

func authPizza(f []byte) (*response, error) {
	scores := &response{}

	req := &request{}
	req.Payload.Image.Bytes = f
	j, err := json.Marshal(req)
	if err != nil {
		return scores, fmt.Errorf("coudn't create json: %s", err)
	}

	res, code, err := modelCall(authModelURL, "POST", j)

	if err != nil {
		return scores, fmt.Errorf("error calling model: %d, %s", code, err)
	}

	if err := json.Unmarshal(res, &scores); err != nil {
		return scores, fmt.Errorf("error marshaling json: %d, %s", code, err)
	}

	return scores, nil
}

func generateID() string {
	return uuid.Must(uuid.NewV4(), nil).String()
}

func sendJSON(w http.ResponseWriter, content string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	fmt.Fprint(w, content)
}

func sendText(w http.ResponseWriter, content string, status int) {
	w.WriteHeader(status)
	fmt.Fprint(w, content)
}

func sendError(w http.ResponseWriter, err error) {
	msg := fmt.Sprintf("{\"error\":\"%s\"}", err)
	sendJSON(w, msg, http.StatusInternalServerError)
}

func sendMessage(w http.ResponseWriter, message string) {
	msg := fmt.Sprintf("{\"msg\":\"%s\"}", message)
	sendJSON(w, msg, http.StatusOK)
}

type resultImageResponse struct {
	URL string `json:"url"`
}

type tag struct {
	Key   string
	Value string
}

type templateVars struct {
	URL  string
	Tags []tag
}

type queryResult struct {
	ID        string  `json:"id"`
	IsPizza   []score `json:"is_pizza"`
	PizzaAuth []score `json:"pizza_auth"`
}

type score struct {
	Classification struct {
		Score float64 `json:"score"`
	} `json:"classification"`
	Name string `json:"displayName"`
}

type request struct {
	Payload struct {
		Image struct {
			Bytes []byte `json:"imageBytes"`
		} `json:"image"`
	} `json:"payload"`
}

type response struct {
	Payload []score `json:"payload"`
}

func modelCall(url, method string, data []byte) ([]byte, int, error) {

	var client = oauthClient

	req, err := http.NewRequest(method, url, bytes.NewBuffer(data))
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("could not create request for HTTP: %v", err)
	}

	req.Header.Add("Content-type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		if strings.Index(err.Error(), "Deadline exceeded (timeout)") > -1 ||
			strings.Index(err.Error(), "API error 5 (urlfetch: DEADLINE_EXCEEDED)") > -1 {
			b := []byte{}
			return b, http.StatusInternalServerError, fmt.Errorf("Model timed out, needs to be warmed up? : %s", err)
		}
		return nil, http.StatusInternalServerError, fmt.Errorf("could not execute HTTP request for HTTP: %v", err)
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("could not read HTTP request for HTTP: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		if strings.Index(string(b), "INVALID_ARGUMENT") > -1 {
			return b, resp.StatusCode, fmt.Errorf("invalid argument: %d, %s", resp.StatusCode, string(b))
		}

		if strings.Index(string(b), "operation timed out") > -1 {
			return b, resp.StatusCode, fmt.Errorf("timeout: %d, %s", resp.StatusCode, string(b))
		}

		if strings.Index(string(b), "Internal error encountered") > -1 {
			return b, resp.StatusCode, fmt.Errorf("internal error: %d, %s", resp.StatusCode, string(b))
		}

		return b, resp.StatusCode, fmt.Errorf("got an HTTP error: %d, %s Model not warmed up yet?", resp.StatusCode, string(b))
	}

	if err != nil {
		return b, resp.StatusCode, fmt.Errorf("got an HTTP error: %d, %s Model not warmed up yet?", resp.StatusCode, b)
	}

	return b, resp.StatusCode, nil
}
