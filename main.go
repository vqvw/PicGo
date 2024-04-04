package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"text/template"
)

var addr = flag.String("addr", ":8080", "http service address")
var clientData = make(map[*Client]map[string]string)

func check(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	flag.Parse()

	thisDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	check(err)

	t := template.Must(template.ParseGlob(path.Join(thisDir, "client/pages/*.html")))
	fmt.Println("Templates parsed")

	hub := newHub()
	go hub.run()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		resource := r.URL.Path

		if resource == "/" {
			err = t.ExecuteTemplate(w, "index.html", nil)
			check(err)
		} else {
			staticFile := path.Join(thisDir, "client/static", resource[1:])
			if info, err := os.Stat(staticFile); err == nil && !info.IsDir() {
				http.ServeFile(w, r, staticFile)
			} else {
				w.WriteHeader(http.StatusNotFound)
				err = t.ExecuteTemplate(w, "404.html", nil)
				check(err)
			}
		}
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	http.HandleFunc("/spa/", func(w http.ResponseWriter, r *http.Request) {
		if val, ok := r.URL.Query()["n"]; ok {
			nickname := val[0]
			if val, ok := r.URL.Query()["t"]; ok {
				token := val[0]

				for _, client := range clientData {
					if client["nickname"] == nickname && client["token"] == token {
						http.ServeFile(w, r, path.Join(thisDir, "client/spa", path.Base(r.URL.Path)+".html"))
						return
					}
				}
			}
		}
		http.Error(w, "Forbidden", http.StatusForbidden)
	})

	err = http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
