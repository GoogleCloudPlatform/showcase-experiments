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
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"google.golang.org/appengine"
)

var (
	db          *sql.DB
	queryString = "SELECT probability_of_answer, probability_of_downvote, minutes FROM questions WHERE tag = ? AND first_word = ? AND ends_question = ? AND weekday_utc = ? AND account_creation_year = ? AND question_length = ? AND hour_utc = ?"
	port        = ""
)

func main() {
	var err error
	db, err = getDatabase()
	if err != nil {
		log.Printf("Failed to establish connection to Database. Server terminated")
		return
	}

	port = os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/experiment/bqml-stackoverflow/api/", func(w http.ResponseWriter, r *http.Request) {
		rows, err := attemptQuery(5, r)
		if err != nil {
			log.Printf("db.Query: %v", err)

			w.Write(getEmptyAnswer())
			return
		}
		defer rows.Close()

		fmt.Printf("%v\n", rows)

		if rows.Next() {
			var probabilityOfAnswer float32
			var probablityOfDownvote float32
			var minutes float32

			if err := rows.Scan(&probabilityOfAnswer, &probablityOfDownvote, &minutes); err != nil {
				log.Printf("rows.Scan: %v", err)
			}

			var answer = &Answer{
				Minutes:   minutes,
				PDownvote: probablityOfDownvote,
				PAnswer:   probabilityOfAnswer,
			}

			json, _ := json.Marshal(answer)

			w.Write(json)
		} else {
			w.Write(getEmptyAnswer())
		}

	})

	fs := wrapHandler(http.FileServer(http.Dir("./dist")))
	http.HandleFunc("/", fs)

	fmt.Printf("Starting server on port %s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}

}

func getEmptyAnswer() []byte {
	json, _ := json.Marshal(&Answer{
		Minutes:   0,
		PAnswer:   0,
		PDownvote: 0,
	})

	return json
}

func getDatabase() (*sql.DB, error) {
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	table := os.Getenv("DB_DATABASE")
	instance := os.Getenv("DB_INSTANCE")

	if appengine.IsDevAppServer() {
		return sql.Open("mysql", fmt.Sprintf("%s:%s@tcp([localhost]:3306)/%s", user, password, table))
	}
	log.Printf("Database call to (%s)/%s", instance, table)
	return sql.Open("mysql", fmt.Sprintf("%s:%s@cloudsql(%s)/%s", user, password, instance, table))
}

func attemptQuery(attempts int, r *http.Request) (*sql.Rows, error) {
	var rows *sql.Rows
	var err error

	query := r.URL.Query()

	for i := 0; i < attempts; i++ {
		rows, err = db.Query(
			queryString,
			query.Get("tag"),
			query.Get("first_word"),
			query.Get("ends_question"),
			query.Get("weekday_utc"),
			query.Get("account_creation_year"),
			query.Get("question_length"),
			query.Get("hour_utc"),
		)

		if err == nil {
			break
		} else {
			db, err = getDatabase()
		}
	}

	return rows, err
}

// Answer respresents the api query response json.
type Answer struct {
	Minutes   float32 `json:"minutes"`
	PAnswer   float32 `json:"probability_of_answer"`
	PDownvote float32 `json:"probabiliy_of_downvote"`
}

type NotFoundRedirectRespWr struct {
	http.ResponseWriter // We embed http.ResponseWriter
	status              int
}

func (w *NotFoundRedirectRespWr) WriteHeader(status int) {
	w.status = status // Store the status for our own use
	if status != http.StatusNotFound {
		w.ResponseWriter.WriteHeader(status)
	}
}

func (w *NotFoundRedirectRespWr) Write(p []byte) (int, error) {
	if w.status != http.StatusNotFound {
		return w.ResponseWriter.Write(p)
	}
	return len(p), nil // Lie that we successfully written it
}

func wrapHandler(h http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		nfrw := &NotFoundRedirectRespWr{ResponseWriter: w}
		h.ServeHTTP(nfrw, r)
		if nfrw.status == 404 {
			http.Redirect(w, r, "/index.html", http.StatusFound)
		}
	}
}
