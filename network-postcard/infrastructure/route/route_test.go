package route

import (
	"encoding/base64"
	"image"
	"image/png"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"testing"
	"time"
)

func TestRandomInt(t *testing.T) {
	trials := 1000

	for i := 0; i < trials; i++ {
		cases := []struct {
			min int
			max int
		}{
			{100, 800},
		}

		for _, c := range cases {
			got := randomInt(c.min, c.max)
			if got > c.max {
				t.Fatalf("randomInt(%d,%d) got %d, want less than %d", c.min, c.max, got, c.max)
			}
			if got < c.min {
				t.Fatalf("randomInt(%d,%d) got %d, want more than %d", c.min, c.max, got, c.min)
			}
		}
	}

}

func TestRandomSlot(t *testing.T) {
	for i := 0; i <= 8; i++ {
		getImagePlacement(i)
	}

}

func TestHops(t *testing.T) {
	r := &Route{ID: NewID(32)}
	r.AddNode(Node{Host: Host{Name: "asia-east1-a"}})
	r.AddNode(Node{Host: Host{Name: "asia-northeast1-a"}})
	r.AddNode(Node{Host: Host{Name: "australia-southeast1-a"}})
	r.AddNode(Node{Host: Host{Name: "us-west1-a"}})
	r.AddNode(Node{Host: Host{Name: "us-central1-f"}})
	r.AddNode(Node{Host: Host{Name: "us-east4-a"}})
	r.AddNode(Node{Host: Host{Name: "europe-west2-b"}})
	r.AddNode(Node{Host: Host{Name: "europe-west3-a"}})
	r.AddNode(Node{Host: Host{Name: "southamerica-east1-a"}})

	cases := []struct {
		i int
		o string
		d string
	}{
		{0, "asia-east1-a", "asia-northeast1-a"},
		{1, "asia-northeast1-a", "australia-southeast1-a"},
		{2, "australia-southeast1-a", "us-west1-a"},
		{3, "us-west1-a", "us-central1-f"},
		{4, "us-central1-f", "us-east4-a"},
		{5, "us-east4-a", "europe-west2-b"},
		{6, "europe-west2-b", "europe-west3-a"},
		{7, "europe-west3-a", "southamerica-east1-a"},
	}

	for _, c := range cases {

		if r.Hops[c.i].Origin.Host.Name != c.o || r.Hops[c.i].Destination.Host.Name != c.d {
			t.Errorf("wrong hop expected %s -> %s got: %s -> %s", c.o, c.d, r.Hops[c.i].Origin.Host.Name, r.Hops[c.i].Destination.Host.Name)
		}

	}

}

func TestHopsPostOrder(t *testing.T) {
	r := &Route{ID: NewID(32)}
	r.AddNode(Node{Host: Host{Name: "asia-east1-a"}})
	r.AddNode(Node{Host: Host{Name: "asia-northeast1-a"}})
	r.AddNode(Node{Host: Host{Name: "australia-southeast1-a"}})
	r.AddNode(Node{Host: Host{Name: "europe-west2-b"}})
	r.AddNode(Node{Host: Host{Name: "europe-west3-a"}})
	r.AddNode(Node{Host: Host{Name: "southamerica-east1-a"}})
	r.AddNode(Node{Host: Host{Name: "us-west1-a"}})
	r.AddNode(Node{Host: Host{Name: "us-central1-f"}})
	r.AddNode(Node{Host: Host{Name: "us-east4-a"}})

	r.Order()

	cases := []struct {
		i int
		o string
		d string
	}{
		{0, "asia-east1-a", "asia-northeast1-a"},
		{1, "asia-northeast1-a", "australia-southeast1-a"},
		{2, "australia-southeast1-a", "us-west1-a"},
		{3, "us-west1-a", "us-central1-f"},
		{4, "us-central1-f", "us-east4-a"},
		{5, "us-east4-a", "europe-west2-b"},
		{6, "europe-west2-b", "europe-west3-a"},
		{7, "europe-west3-a", "southamerica-east1-a"},
	}

	for _, c := range cases {

		if r.Hops[c.i].Origin.Host.Name != c.o || r.Hops[c.i].Destination.Host.Name != c.d {
			t.Errorf("wrong hop expected %s -> %s got: %s -> %s", c.o, c.d, r.Hops[c.i].Origin.Host.Name, r.Hops[c.i].Destination.Host.Name)
		}

	}

}

func TestImageStamp(t *testing.T) {

	route, err := dummyRoute()
	if err != nil {
		t.Errorf("could not get dummy route: %v", err)
	}

	route.Stamp("in")
	if err := route.StampImage("australia-southeast1-a"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("us-central1-f"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("asia-east1-a"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("asia-northeast1-a"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("europe-west2-b"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("europe-west3-a"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("us-west1-a"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	route.Stamp("in")
	if err := route.StampImage("us-east4-a"); err != nil {
		t.Errorf("could not stamp image: %v", err)
	}
	route.Stamp("out")
	img := base64.NewDecoder(base64.StdEncoding, strings.NewReader(route.Postcard))

	stamp, format, err := image.Decode(img)
	if err != nil {
		t.Errorf("could not decode stamp file: %v", err)
	}

	if format != "png" {
		t.Errorf("wrong format: %s", format)
	}

	out, err := os.Create("./output.png")
	if err != nil {
		t.Errorf("could not create output file: %v", err)
	}
	png.Encode(out, stamp)

}

func TestCalculateHops(t *testing.T) {
	route, err := dummyRoute()
	if err != nil {
		t.Errorf("could not get dummy route: %v", err)
	}

	if err := route.CalculateHops(); err != nil {
		t.Errorf("could not get calculate hops: %v", err)
	}

	for _, hop := range route.Hops {
		if hop.Seconds != 0 {
			t.Errorf("calculate hop %s -> %s wrong got  %f, wanted %d", hop.Origin.Host.Name, hop.Destination.Host.Name, hop.Seconds, 0)
		}
	}

}

func TestCalculateTotal(t *testing.T) {
	route, err := dummyRoute()
	if err != nil {
		t.Errorf("could not get dummy route: %v", err)
	}

	if err := route.CalculateTotal(); err != nil {
		t.Errorf("could not get calculate hops: %v", err)
	}

	if route.Total.Seconds != 6 {
		t.Errorf("calculate hop %s -> %s wrong got  %f, wanted %d", route.Total.Origin.Host.Name, route.Total.Destination.Host.Name, route.Total.Seconds, 6)
	}

}

func TestJustStartedl(t *testing.T) {
	route, err := dummyRoute()
	if err != nil {
		t.Errorf("could not get dummy route: %v", err)
	}

	if err := route.CalculateTotal(); err != nil {
		t.Errorf("could not get calculate hops: %v", err)
	}

	if route.Total.Seconds != 6 {
		t.Errorf("calculate hop %s -> %s wrong got  %f, wanted %d", route.Total.Origin.Host.Name, route.Total.Destination.Host.Name, route.Total.Seconds, 6)
	}

}

func TestGetAllHops(t *testing.T) {
	route, err := dummyRoute()

	if err != nil {
		t.Errorf("could not get dummy route: %v", err)
	}
	route.AllNodes = route.Nodes
	route.ConvertAllNodesToHops()
	if len(route.AllHops) != 7 {
		t.Errorf("wrong number of hops, expected 7 got %d:", len(route.AllHops))

	}

}

func TestStatusFunctions(t *testing.T) {

	route1, err := dummyRoute()
	if err != nil {
		t.Errorf("could not get dummy route: %v", err)
	}

	route2 := &Route{ID: NewID(32)}
	route2.AddNode(Node{Host: Host{Name: "asia-east1-a"}})
	route2.AddNode(Node{Host: Host{Name: "asia-northeast1-a"}})
	route2.AddNode(Node{Host: Host{Name: "australia-southeast1-a"}})
	route2.AddNode(Node{Host: Host{Name: "europe-west2-b"}})
	route2.AddNode(Node{Host: Host{Name: "europe-west3-a"}})
	route2.AddNode(Node{Host: Host{Name: "southamerica-east1-a"}})
	route2.AddNode(Node{Host: Host{Name: "us-west1-a"}})
	route2.AddNode(Node{Host: Host{Name: "us-central1-f"}})
	route2.AddNode(Node{Host: Host{Name: "us-east4-a"}})

	cases := []struct {
		r    *Route
		want bool
		f    func() bool
	}{
		{route1, true, route1.Done},
		{route2, false, route2.Done},
		{route1, false, route1.JustStarted},
		{route2, true, route2.JustStarted},
	}

	for i, c := range cases {

		if c.f() != c.want {
			t.Errorf("problem with done in case %d: want %t, got %t", i, c.want, c.r.Done())
		}

	}
}

func BenchmarkImageStamp(b *testing.B) {
	route, err := dummyRoute()
	if err != nil {
		b.Errorf("could not get dummy route: %v", err)
	}

	for n := 0; n < b.N; n++ {
		route.Stamp("in")
		if err := route.StampImage("australia-southeast1-a"); err != nil {
			b.Errorf("could not stamp image: %v", err)
		}
		route.Stamp("out")

	}
}

func dummyRoute() (*Route, error) {
	r := &Route{ID: NewID(32)}
	r.Nodes = []Node{
		Node{Host: Host{Name: "australia-southeast1-a"}, In: time.Date(2017, 12, 17, 1, 0, 1, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 2, 0, time.UTC)},
		Node{Host: Host{Name: "us-central1-f"}, In: time.Date(2017, 12, 17, 1, 0, 2, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 3, 0, time.UTC)},
		Node{Host: Host{Name: "asia-east1-a"}, In: time.Date(2017, 12, 17, 1, 0, 3, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 4, 0, time.UTC)},
		Node{Host: Host{Name: "asia-northeast1-a"}, In: time.Date(2017, 12, 17, 1, 0, 4, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 5, 0, time.UTC)},
		Node{Host: Host{Name: "europe-west2-b"}, In: time.Date(2017, 12, 17, 1, 0, 5, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 6, 0, time.UTC)},
		Node{Host: Host{Name: "europe-west3-a"}, In: time.Date(2017, 12, 17, 1, 0, 6, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 7, 0, time.UTC)},
		Node{Host: Host{Name: "us-west1-a"}, In: time.Date(2017, 12, 17, 1, 0, 7, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 8, 0, time.UTC)},
		Node{Host: Host{Name: "us-east4-a"}, In: time.Date(2017, 12, 17, 1, 0, 8, 0, time.UTC), Out: time.Date(2017, 12, 17, 1, 0, 9, 0, time.UTC)},
	}

	img, err := ioutil.ReadFile(ImagePath + "/postcard.png")
	if err != nil {
		log.Printf("could not open base image: %v", err)
	}

	r.Postcard = base64.StdEncoding.EncodeToString(img)

	return r, nil
}
