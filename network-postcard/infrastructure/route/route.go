// Package route is designed for showing off the performance of the Google Cloud
// network you get when you use Compute Engine vms. It turns a GCE host and
// creates a path around the world from vm to vm that will pass an image around
// like postcard and stamp it with a png stamp for the area the machine in in.
package route

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io/ioutil"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/gobolditalic"
	"golang.org/x/image/font/gofont/gomonoitalic"
	"golang.org/x/image/font/gofont/goregular"
	"golang.org/x/image/math/fixed"

	"github.com/disintegration/imaging"
	"github.com/golang/freetype/truetype"
	"github.com/tpryan/gcprelay/infrastructure/gcloud"
)

var (
	// ErrNoMoreToStamp is an error means there are no more entries in the
	// route that need stamping.
	ErrNoMoreToStamp = fmt.Errorf("There are no more entries to stamp")
	// ErrNoOpEntered is an error that means that an operation wasn't entered
	ErrNoOpEntered = fmt.Errorf("no operation selected")
	// ImagePath is the filesystem location where the images for stamping
	// are located
	ImagePath string
	images    = make(map[string]image.Image)
	self      string
)

func init() {
	ImagePath = os.Getenv("GCPRELAY_IMAGEPATH")
	if ImagePath == "" {
		ImagePath = "/usr/local/gcprelay"
	}
	if err := loadImages(ImagePath); err != nil {
		log.Printf("could not get load images: %v", err)
	}

	var err error
	self, err = gcloud.Metadata("name")
	if err != nil {
		log.Printf("could not get host name: %v", err)
	}
}

// GetImage returns an image from the package pre loaded images. This allows
// us to only call images from the filesystem on startup
func GetImage(name string) (image.Image, error) {
	result, ok := images[name]
	if !ok {
		return nil, fmt.Errorf("image '%s' does not exist", name)
	}

	return result, nil
}

func loadImages(imagePath string) error {
	files, err := ioutil.ReadDir(imagePath)
	if err != nil {
		return fmt.Errorf("could read image dir '%s': %v", imagePath, err)
	}

	for _, f := range files {
		fname := f.Name()

		name := strings.TrimSuffix(fname, filepath.Ext(fname))
		if filepath.Ext(fname) != ".png" {
			continue
		}

		stampPath := imagePath + "/" + f.Name()
		stampFile, err := os.Open(stampPath)
		if err != nil {
			return fmt.Errorf("could net get stamp '%s' from os: %v", stampPath, err)
		}
		stamp, _, err := image.Decode(stampFile)
		if err != nil {
			return fmt.Errorf("could not decode stamp '%s': %v ", stampPath, err)
		}
		images[name] = stamp

	}

	return nil
}

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

// NewID returns a randmomly generated ID string from each route.
func NewID(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}

// Host represents the networking endpoints of an individual machine.
type Host struct {
	Name     string `json:"name,omitempty"`
	Endpoint string `json:"endpoint,omitempty"`
	Private  string `json:"private,omitempty"`
}

// Node is a stop along the route. It consists of a host and a time in and
// time out.
type Node struct {
	Host Host      `json:"host,omitempty"`
	In   time.Time `json:"in,omitempty"`
	Out  time.Time `json:"out,omitempty"`
	Slot int       `json:"slot,omitempty"`
}

// Done answers if the node has had the route pass through it yet.
func (n *Node) Done() bool {
	if !n.In.IsZero() && !n.Out.IsZero() {
		return true
	}
	return false
}

// Route is the path we are passing through the network.
type Route struct {
	ID          string `json:"ID,omitempty"`
	Nodes       []Node `json:"nodes,omitempty"`
	Hops        []Hop  `json:"hops,omitempty"`
	Total       Hop    `json:"total,omitempty"`
	Postcard    string `json:"postcard,omitempty"`
	Initialized bool
	AllNodes    []Node    `json:"allnodes,omitempty"`
	AllHops     []Hop     `json:"allhops,omitempty"`
	LastUpdate  time.Time `json:"lastupdate,omitempty"`
}

// Next returns the next Node that to which we need to relay
func (r *Route) Next() string {
	for _, n := range r.Nodes {
		if n.In.IsZero() {
			return n.Host.Private
		}
	}
	return ""
}

// AddNode handles adding a Node to the route, and handles adding the Hop.
func (r *Route) AddNode(n Node) {
	r.Nodes = append(r.Nodes, n)

	count := len(r.Nodes)
	if count > 1 {
		hop := Hop{
			Origin:      r.Nodes[count-2],
			Destination: r.Nodes[count-1],
		}
		r.Hops = append(r.Hops, hop)
	}
}

// CurrentNode will return the index of the current node we are working on
func (r *Route) CurrentNode(name string) int {
	for i, n := range r.Nodes {
		if n.Host.Name == name {
			return i
		}
	}
	return len(r.Nodes)
}

// JustStarted answers true if the route hasn't been passed around yet.
func (r *Route) JustStarted() bool {
	return !r.Nodes[0].Done()
}

// CalculateLastHop sets the duration of the last hop in the route.
func (r *Route) CalculateLastHop() error {
	r.Hops[r.LastHop()].CalculateDuration()
	return nil
}

// LastHop returns the index of the last hop in the route.
func (r *Route) LastHop() int {
	for i := 1; i < len(r.Hops); i++ {
		if r.Hops[i].Destination.Host.Name == self {
			return i
		}
	}
	return 0
}

// CalculateHops spins through the nodes, and calculates the duration of
// all of the hops
func (r *Route) CalculateHops() error {
	r.Hops = []Hop{}
	for i := 1; i < len(r.Nodes); i++ {
		d := r.Nodes[i]
		o := r.Nodes[i-1]
		if d.Done() && o.Done() {
			r.Hops = append(r.Hops, NewHop(o, d))
		}
	}
	return nil
}

func (r *Route) ConvertAllNodesToHops() {

	for i, _ := range r.AllNodes {
		h := NewHop(r.AllNodes[i], r.AllNodes[i+1])
		r.AllHops = append(r.AllHops, h)
		if i+2 == len(r.AllNodes) {
			break
		}
	}

}

// UpdateHops spins through the nodes, and calculates the duration of
// all of the hops
func (r *Route) UpdateHops() error {
	r.Hops = []Hop{}
	for i := 1; i < len(r.Nodes); i++ {
		d := r.Nodes[i]
		o := r.Nodes[i-1]
		r.Hops = append(r.Hops, NewHop(o, d))
	}
	return nil
}

// Stamp sets either the 'in' or 'out' timestamp on the route node.
func (r *Route) Stamp(io string) error {
	if io == "" {
		return ErrNoOpEntered
	}

	if io == "in" {
		for i, n := range r.Nodes {
			if n.In.IsZero() {
				n.In = time.Now()
				r.LastUpdate = time.Now()
				r.Nodes[i] = n
				return nil
			}
		}
	}
	if io == "out" {
		for i, n := range r.Nodes {
			if n.Out.IsZero() {
				n.Out = time.Now()

				r.Nodes[i] = n
				return nil
			}
		}
	}
	return ErrNoMoreToStamp
}

// Done reports true when all of the nodes in the route are marked done.
func (r *Route) Done() bool {
	for _, n := range r.Nodes {
		if n.Out.IsZero() {
			return false
		}
	}
	return true
}

// CalculateTotal generates a hop for the first to last node.
func (r *Route) CalculateTotal() error {
	var h Hop

	h.Origin = r.Nodes[0]
	h.Destination = r.Nodes[len(r.Nodes)-1]
	h.CalculateDuration()
	r.Total = h

	return nil
}

// CalculateTransitTime does the math to figure out how long a set of Hops took
// based on their in and out times
func (r *Route) CalculateTransitTime() float64 {
	result := float64(0)
	for i, hop := range r.Hops {
		if hop.Seconds == 0 {
			hop.CalculateDuration()
		}
		log.Printf("%d %s-%s: %f\n", i, hop.Origin.Host.Name, hop.Destination.Host.Name, hop.Seconds)
		result += hop.Seconds
	}
	return result
}

func randomFloat(min, max float64) float64 {
	rand.Seed(time.Now().UnixNano())
	return rand.Float64()*(max-min) + min
}

func randomInt(min, max int) int {
	rand.Seed(time.Now().UnixNano())
	return rand.Intn(max-min) + min
}

// Shuffle creates a route that has a random set of routes.
func (r *Route) Shuffle() error {
	count := len(r.Nodes)
	var nodes []Node

	order := rand.Perm(count)

	for _, val := range order {
		nodes = append(nodes, r.Nodes[val])
	}

	r.Nodes = nodes
	err := r.UpdateHops()
	if err != nil {
		return err
	}

	return nil
}

// Order sets up a particular order for the route.
// australia-southeast1-a
// asia-east1-a
// asia-northeast1-a
// us-west1-a
// southamerica-east1-a
// us-central1-f
// us-east4-a
// europe-west2-b
// europe-west3-a
func (r *Route) Order() error {
	var nodes []Node

	order := []string{
		"asia-east1-a",
		"asia-northeast1-a",
		"australia-southeast1-a",
		"us-west1-a",
		"us-central1-f",
		"us-east4-a",
		"europe-west2-b",
		"europe-west3-a",
		"southamerica-east1-a",
	}

	randslots := rand.Perm(9)

	for i, name := range order {
		n, err := r.getNodeByName(name)
		if err != nil {
			return err
		}
		n.Slot = randslots[i]
		nodes = append(nodes, *n)
	}

	r.Nodes = nodes
	err := r.UpdateHops()
	if err != nil {
		return err
	}

	return nil
}

func (r *Route) getNodeByName(name string) (*Node, error) {
	for _, n := range r.Nodes {
		if n.Host.Name == name {
			return &n, nil
		}
	}
	return nil, fmt.Errorf("input node (%s) was not found in route", name)
}

// StampImage takes the relayed postcard and adds a stamp image that
// corresponds with current host
func (r *Route) StampImage(name string) error {

	img := base64.NewDecoder(base64.StdEncoding, strings.NewReader(r.Postcard))

	stamp, err := GetImage(name)
	if err != nil {
		return fmt.Errorf("could not get stamp: %v", err)
	}

	// stamp = resize.Resize(75, 0, stamp, resize.Lanczos3)

	rand.Seed(time.Now().UTC().UnixNano())
	rot := randomFloat(-45, 45)
	stamp = imaging.Rotate(stamp, rot, color.RGBA{.0, .0, .0, .0})

	postcard, _, err := image.Decode(img)
	if err != nil {
		return fmt.Errorf("could not decode image %v", err)
	}

	zed := image.Point{0, 0}
	rec := image.Rectangle{zed, zed.Add(postcard.Bounds().Size())}

	rgba := image.NewRGBA(rec)
	slot := r.Nodes[r.CurrentNode(name)].Slot

	ranX, ranY := getImagePlacement(slot)

	draw.Draw(rgba, postcard.Bounds(), postcard, zed, draw.Over)
	draw.Draw(rgba, rec, stamp, image.Point{-ranX, -ranY}, draw.Over)

	if err := r.SetPostcard(rgba); err != nil {
		return fmt.Errorf("could not get set the postcard")
	}

	return nil
}

// MatteImage places the image matte over the transmitted image.
func (r *Route) MatteImage() error {

	img := base64.NewDecoder(base64.StdEncoding, strings.NewReader(r.Postcard))

	matte, err := GetImage("matte")
	if err != nil {
		return fmt.Errorf("could not get matte: %v", err)
	}

	postcard, _, err := image.Decode(img)
	if err != nil {
		return fmt.Errorf("could not decode image %v", err)
	}

	zed := image.Point{0, 0}
	rec := image.Rectangle{zed, zed.Add(postcard.Bounds().Size())}
	rgba := image.NewRGBA(rec)

	draw.Draw(rgba, postcard.Bounds(), postcard, zed, draw.Over)
	draw.Draw(rgba, rec, matte, image.Point{0, 0}, draw.Over)

	if err := r.SetPostcard(rgba); err != nil {
		return fmt.Errorf("could not get set the postcard")
	}

	return nil
}

// LastStamp should fire on the last hop that a route take, and adds total time
// to the picture.
func (r *Route) LastStamp() error {

	img := base64.NewDecoder(base64.StdEncoding, strings.NewReader(r.Postcard))

	postcard, _, err := image.Decode(img)
	if err != nil {
		return fmt.Errorf("could not decode image %v", err)
	}

	zed := image.Point{0, 0}
	rec := image.Rectangle{zed, zed.Add(postcard.Bounds().Size())}

	rgba := image.NewRGBA(rec)

	draw.Draw(rgba, postcard.Bounds(), postcard, zed, draw.Over)

	num := len(r.Nodes) - 1
	total := fmt.Sprintf("transfered in %f seconds ", r.CalculateTransitTime())
	addLabel(rgba, 55, 700, 10, r.Nodes[0].Host.Name, "gobold")
	addLabel(rgba, 100, 700, 10, " - ", "gobold")
	addLabel(rgba, 150, 700, 10, r.Nodes[num].Host.Name, "gobold")
	addLabel(rgba, 300, 700, 10, total, "gobold")

	if err := r.SetPostcard(rgba); err != nil {
		return fmt.Errorf("could not get set the postcard")
	}

	return nil
}

type boundary struct {
	Label string
	XMin  int
	XMax  int
	YMin  int
	YMax  int
}

func getImagePlacement(slot int) (int, int) {
	areas := map[int]boundary{
		0: {"topgutter1", 50, 150, -20, 20},
		1: {"topgutter2", 150, 300, -20, 20},
		2: {"topgutter3", 300, 380, -20, 20},

		3: {"leftgutter1", 0, 20, 50, 150},
		4: {"leftgutter2", 0, 20, 150, 180},
		5: {"leftgutter3", 0, 20, 300, 340},

		6: {"rightgutter1", 300, 360, 50, 150},
		7: {"rightgutter2", 300, 360, 150, 180},
		8: {"rightgutter3", 300, 360, 300, 340},
	}
	area, _ := areas[slot]

	return randomInt(area.XMin, area.XMax), randomInt(area.YMin, area.YMax)

}

// SetPostcard sets the image in both encoded and binary version. For GRPC.
func (r *Route) SetPostcard(img image.Image) error {

	encoder := png.Encoder{CompressionLevel: png.BestSpeed}

	buf := new(bytes.Buffer)

	if err := encoder.Encode(buf, img); err != nil {
		return fmt.Errorf("could not encode image: %v", err)
	}
	r.Postcard = base64.StdEncoding.EncodeToString(buf.Bytes())

	return nil
}

func addLabel(img *image.RGBA, x, y int, fontsize float64, label, family string) {
	col := color.RGBA{0, 0, 0, 200}
	point := fixed.Point26_6{X: fixed.Int26_6(x * 64), Y: fixed.Int26_6(y * 64)}

	f := gomonoitalic.TTF

	switch family {
	case "goregular":
		f = goregular.TTF
	case "gobold":
		f = gobold.TTF
	case "gobolditalic":
		f = gobolditalic.TTF
	default:
		f = gomonoitalic.TTF
	}

	gofont, _ := truetype.Parse(f)
	goface := truetype.NewFace(gofont, &truetype.Options{Size: fontsize})

	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(col),
		Face: goface,
		Dot:  point,
	}
	d.DrawString(label)
}

// Hop represents a path on the route form origin node to destination node.
type Hop struct {
	Origin      Node          `json:"origin,omitempty"`
	Destination Node          `json:"destination,omitempty"`
	Duration    time.Duration `json:"duration,omitempty"`
	Nanoseconds int64         `json:"nanoseconds,omitempty"`
	Seconds     float64       `json:"seconds,omitempty"`
}

// NewHop returns a new hop for which we have done the math.
func NewHop(o, d Node) Hop {
	hop := Hop{Origin: o, Destination: d}
	hop.CalculateDuration()
	return hop
}

// CalculateDuration does the math for a hop.
func (h *Hop) CalculateDuration() error {
	h.Duration = h.Destination.In.Sub(h.Origin.Out)
	h.Seconds = h.Duration.Seconds()
	h.Nanoseconds = h.Duration.Nanoseconds()
	return nil
}
