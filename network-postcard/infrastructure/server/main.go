package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	_ "image/jpeg"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	//change these to point to cloud repo when you move it.
	"github.com/tpryan/gcprelay/infrastructure/gcloud"
	"github.com/tpryan/gcprelay/infrastructure/persist"
	"github.com/tpryan/gcprelay/infrastructure/route"
)

var (
	name             string
	projectID        string
	logPath          string
	defaultRouteFunc = getRandomRoute
	endpointcert     = "/etc/ssl/certs/fullchain.pem"
	cert             = "/etc/ssl/certs/gcprelay.crt"
	key              = "/etc/ssl/certs/gcprelay.key"
	// SSL adds some overhead to the relay, so it's plain old http in backend
	// communication.
	protocol = "http"
)

func main() {

	http.DefaultClient.Timeout = time.Second * 10
	var err error
	log.SetFlags(log.Lmicroseconds)

	port := os.Getenv("GCPRELAY_PORT")
	if port == "" {
		port = ":80"
	}

	logPath = os.Getenv("GCPRELAY_LOGPATH")
	if logPath == "" {
		logPath = "/var/log/gcprelay"
	}

	if _, err := os.Stat(endpointcert); err == nil {
		cert = "/etc/ssl/certs/fullchain.pem"
		key = "/etc/ssl/certs/privkey.pem"
	}

	projectID, err = gcloud.Metadata("project-id")
	if err != nil {
		log.Printf("error: could not get project id from metatdata: %v", err)
	}

	name, err = gcloud.Metadata("name")
	if err != nil {
		log.Printf("error: could not get machine name from metatdata: %v", err)
	}

	if err := registerWithFirestore(); err != nil {
		log.Printf("could not register: %v", err)
	}

	http.HandleFunc("/favicon.ico", handleIcon)
	http.HandleFunc("/list", handleList)
	http.HandleFunc("/relay", handleRelay)
	http.HandleFunc("/", handleHealth)

	s := &http.Server{Addr: port,
		ReadTimeout:    5 * time.Second,
		WriteTimeout:   10 * time.Second,
		IdleTimeout:    15 * time.Second,
		MaxHeaderBytes: 4096}
	s.SetKeepAlivesEnabled(false)

	if _, err := os.Stat(cert); err == nil {
		go func() {
			log.Printf("gcprelay listening for https on port :443\n")
			s.Addr = ":443"
			err = s.ListenAndServeTLS(cert, key)
			if err != nil {
				log.Fatal("ListenAndServeTLS: ", err)
			}
		}()

	} else {
		log.Printf("gcprelay IS NOT listening for https on port :443\n")
	}

	log.Printf("gcprelay listening for http on port %s\n", port)
	s.Addr = port
	err = s.ListenAndServe()
	if err != nil {
		log.Printf("could not listen for http on port %s: %v", port, err)
	}

}

func handleIcon(w http.ResponseWriter, r *http.Request) {}

func handleList(w http.ResponseWriter, r *http.Request) {
	route, err := defaultRouteFunc()
	if err != nil {
		log.Printf("error: could not get default route: %v", err)
	}

	jsonStr, err := json.MarshalIndent(route, "", "    ")
	if err != nil {
		log.Printf("error: could not marshall default route: %v", err)
	}

	sendJSON(w, string(jsonStr), http.StatusOK)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "ok")
}

func firstHop(w http.ResponseWriter, r *http.Request, id, image string) {
	var route *route.Route
	var err error
	logWithID(id, "FIRST received")
	logWithID(id, "Image received")

	if route, err = defaultRouteFunc(); err != nil {
		logWithID(id, "error: could not get route: %v", err)
	}

	route.Postcard = strings.Replace(image, " ", "+", -1)
	// route.MatteImage()

	rtype := r.URL.Query().Get("type")

	if rtype == "random" {
		route.Shuffle()
	}

	if id != "" {
		route.ID = id
	}

	if err := saveToFirestore(route); err != nil {
		logWithID(id, "error: could not write route to firestore: %v", err)
	}

	jsonStr, err := json.MarshalIndent(route, "", "    ")
	if err != nil {
		logWithID(id, "error: could not marshall route: %v", err)
	}

	sendJSON(w, string(jsonStr), http.StatusOK)

	go func() {
		logWithID(id, "sending message on to next node ")
		if err := sendToNextHost(route); err != nil {
			logWithID(id, "error: could not pass on json: %v", err)
		}
	}()
}

func relayHop(w http.ResponseWriter, r *http.Request) {
	var route *route.Route
	var err error

	if route, err = parseRoute(r); err != nil {
		log.Printf("error: could not parse incoming json")
	}
	logWithID(route.ID, "RELAY received")
	log.Println("stamped in ")
	if err := route.Stamp("in"); err != nil {
		logWithID(route.ID, "error: could not stamp incoming json: %v", err)
	}

	logWithID(route.ID, "stamped image ")
	if err := route.StampImage(name); err != nil {
		log.Printf("error: could not stamp incoming image file: %v", err)
	}

	logWithID(route.ID, "stamped out ")
	if err := route.Stamp("out"); err != nil {
		log.Printf("error: could not stamp outgoing json: %v", err)
	}

	logWithID(route.ID, "calculate route hops")
	if err := route.CalculateHops(); err != nil {
		logWithID(route.ID, "error: could not calculate hops: %v", err)
	}

	if route.Done() {
		route.CalculateTotal()
		route.LastStamp()
	}

	if !route.Done() {
		go func() {
			logWithID(route.ID, "calling http sendToNextHost")
			if err := sendToNextHost(route); err != nil {
				log.Printf("error: could not pass on json: %v", err)
			}
		}()
	}

	go func() {
		logWithID(route.ID, "save to disk")
		if err := saveToDisk(route); err != nil {
			log.Printf("error: could not write route to disk: %v", err)
		}
	}()

	go func() {
		logWithID(route.ID, "save to firestore")
		if err := saveToFirestore(route); err != nil {
			logWithID(route.ID, "error: could not write route to firestore: %v", err)
		}
	}()
	sendJSON(w, "ok", http.StatusOK)

}

func handleRelay(w http.ResponseWriter, r *http.Request) {

	init := r.URL.Query().Get("init")

	if init != "" {
		id := r.URL.Query().Get("id")
		image, err := parseImage(r)
		if err != nil {
			logWithID(id, "error: could not decode image: %v", err)
			return
		}
		firstHop(w, r, id, image)
		return

	}

	relayHop(w, r)

}

func registerWithFirestore() error {

	endpoint, err := gcloud.Metadata("external-ip")
	if err != nil {
		return err
	}

	private, err := gcloud.Metadata("private-ip")
	if err != nil {
		return err
	}

	host := route.Host{
		Name:     name,
		Endpoint: endpoint,
		Private:  private,
	}
	a := persist.Agent{ProjectID: projectID}

	return a.Register(&host)
}

func getRandomRoute() (*route.Route, error) {

	a := persist.Agent{ProjectID: projectID}

	r, err := a.DefaultRoute()
	if err != nil {
		return r, fmt.Errorf("failed to get defaultRoute from agent: %v", err)
	}

	r.Order()
	r.AllNodes = r.Nodes
	r.ConvertAllNodesToHops()
	return r, nil
}

func saveToFirestore(r *route.Route) error {
	a := persist.Agent{ProjectID: projectID}
	return a.RecordRoute(name, r)
}

func sendToNextHost(route *route.Route) error {
	host := route.Next()

	url := protocol + "://" + host + "/relay"

	jsonStr, err := json.Marshal(route)
	if err != nil {
		return fmt.Errorf("error: could not marshal %v", err)
	}

	client := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        50,
			IdleConnTimeout:     15 * time.Second,
			DisableCompression:  true,
			DisableKeepAlives:   true,
			TLSHandshakeTimeout: 2 * time.Second,
			TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
		},
		Timeout: time.Second * 5}

	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonStr))
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return fmt.Errorf("error: client could not relay post to host (%s): %v %v", host, err, resp)
	}

	resp.Body.Close()

	return nil
}

func saveToDisk(r *route.Route) error {
	jsonStr, err := json.MarshalIndent(r, "", "    ")
	if err != nil {
		return err
	}

	fname := fmt.Sprintf("%s/%s_%s.json", logPath, r.ID, strconv.Itoa(r.CurrentNode(name)))

	f, err := os.OpenFile(fname, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	// f, err := os.OpenFile(logPath+"/"+r.ID+"_"+strconv.Itoa(r.CurrentNode(name))+".json", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		return fmt.Errorf("error: could not open log file: %v", err)
	}
	defer f.Close()

	if _, err = f.Write(jsonStr); err != nil {
		return fmt.Errorf("error: could not write to log file: %v", err)
	}
	f.Close()
	return nil
}

func parseRoute(r *http.Request) (*route.Route, error) {
	var rt *route.Route
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return rt, err
	}

	if err = json.Unmarshal(body, &rt); err != nil {
		return rt, err
	}
	return rt, nil
}

func parseImage(r *http.Request) (string, error) {

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func sendJSON(w http.ResponseWriter, content string, status int) {
	w.Header().Add("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	fmt.Fprint(w, content)
}

func logWithID(id, format string, a ...interface{}) {
	if id == "" {
		id = "NO ID"
	}
	log.Printf(id+" - "+format, a...)

}
