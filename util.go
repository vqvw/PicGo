package main

import (
	"crypto/rand"
	"fmt"
)

func genToken() string {
	b := make([]byte, 4)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}
