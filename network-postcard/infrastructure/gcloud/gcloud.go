// Package gcloud organizes requests to gcloud metadata.
package gcloud

import (
	"fmt"
	"net/http"

	"cloud.google.com/go/compute/metadata"
)

// Metadata retrieves specific pieces of Metadata from Google Cloud's
// Compute Engine infrastructure
func Metadata(datatype string) (string, error) {

	client := metadata.NewClient(&http.Client{Transport: userAgentTransport{
		userAgent: "gcprelay-query",
		base:      http.DefaultTransport,
	}})

	switch datatype {
	case "external-ip":
		return client.ExternalIP()
	case "private-ip":
		return client.InternalIP()
	case "name":
		return client.InstanceName()
	case "project-id":
		return client.ProjectID()
	}

	return "", fmt.Errorf("Invalid metadata requests")
}

// userAgentTransport sets the User-Agent header before calling base.
type userAgentTransport struct {
	userAgent string
	base      http.RoundTripper
}

// RoundTrip implements the http.RoundTripper interface.
func (t userAgentTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("User-Agent", t.userAgent)
	return t.base.RoundTrip(req)
}
