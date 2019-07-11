package persist

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/tpryan/gcprelay/infrastructure/route"
	"google.golang.org/api/iterator"
)

var (
	client *firestore.Client
	ctx    = context.Background()
)

// Agent is a go between for the main application and firestore.
type Agent struct {
	ProjectID string
}

// DefaultRoute fetches the list of nodes from Firestore and arranges them
// into a route.Route
func (a *Agent) DefaultRoute() (*route.Route, error) {

	r := &route.Route{ID: route.NewID(32)}
	client, err := a.getClient()
	if err != nil {
		return r, fmt.Errorf("Failed to create client: %v", err)
	}

	iter := client.Collection("nodes").Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return r, fmt.Errorf("Failed to iterate: %v", err)
		}
		var node route.Node
		doc.DataTo(&node.Host)
		r.AddNode(node)
	}

	img, err := route.GetImage("postcard")
	if err != nil {
		return r, fmt.Errorf("Failed to binary something somtheing the image: %v", err)
	}

	if err := r.SetPostcard(img); err != nil {
		return nil, err
	}
	r.Order()

	return r, nil
}

func (a *Agent) getClient() (*firestore.Client, error) {
	if client != nil {
		return client, nil
	}
	return firestore.NewClient(context.Background(), a.ProjectID)
}

// RecordRoute saves a route to firestore for prosperity and so that the front
// end can see what is going own.
func (a *Agent) RecordRoute(name string, r *route.Route) error {
	client, err := a.getClient()
	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}

	defer client.Close()

	if r.JustStarted() {
		log.Printf("firestore first record: %+v", r.ID)
		r.LastUpdate = time.Now()
		if _, err = client.Collection("routes").Doc(r.ID).Set(ctx, r); err != nil {
			return fmt.Errorf("failed to write to firestore: %v", err)
		}
		return nil
	}
	update := map[string]interface{}{
		"ID": r.ID,
	}

	if r.Done() {
		update["Total"] = r.Total
		update["Postcard"] = r.Postcard
		update["LastUpdate"] = r.LastUpdate
	}

	update["Nodes"] = map[string]interface{}{
		strconv.Itoa(r.CurrentNode(name)): r.Nodes[r.CurrentNode(name)],
	}

	if len(r.Hops) > 0 {
		update["Hops"] = map[string]interface{}{
			strconv.Itoa(r.CurrentNode(name) - 1): r.Hops[r.CurrentNode(name)-1],
		}
	}

	doc, err := client.Collection("routes").Doc(r.ID).Get(ctx)
	if err != nil {
		return fmt.Errorf("failed to get old record from firestore: %v", err)
	}

	lastupdate, ok := doc.Data()["LastUpdate"]

	if !ok || lastupdate.(time.Time).Nanosecond() < r.LastUpdate.Nanosecond() {
		fmt.Printf("updating image cause firebase timestamp was ahead or missing: %v raw: %v\n", lastupdate, doc.Data()["LastUpdate"])
		update["Postcard"] = r.Postcard
		update["LastUpdate"] = r.LastUpdate
	} else {
		fmt.Printf("NOT updating image cause firebase timestamp was behind: %v\n", lastupdate)
	}

	if _, err = client.Collection("routes").Doc(r.ID).Set(ctx, update, firestore.MergeAll); err != nil {
		return fmt.Errorf("failed to write to firestore: %v", err)
	}

	return nil
}

// Register records an active node to the firestore list.
func (a *Agent) Register(host *route.Host) error {
	client, err := a.getClient()

	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}
	defer client.Close()

	_, err = client.Collection("nodes").Doc(host.Name).Set(ctx, host)
	if err != nil {
		return fmt.Errorf("failed to register host to firestore: %v", err)
	}
	return nil
}
