package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/vmihailenco/msgpack/v5"
)

type User struct {
	ID       int      `json:"id" msgpack:"id"`
	Username string   `json:"username" msgpack:"username"`
	Tags     []string `json:"tags" msgpack:"tags"`
	Active   bool     `json:"active" msgpack:"active"`
	Balance  float64  `json:"balance" msgpack:"balance"`
}

func main() {
	user := User{
		ID:       123,
		Username: "alice",
		Tags:     []string{"golang", "rust", "json"},
		Active:   true,
		Balance:  1234.56,
	}

	fmt.Println("=== Original Data ===")
	jsonBytes, _ := json.MarshalIndent(user, "", "  ")
	fmt.Println(string(jsonBytes))

	fmt.Println("\n=== MessagePack Encoding ===")
	msgpackBytes, err := msgpack.Marshal(&user)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Encoded bytes: %d\n", len(msgpackBytes))
	fmt.Printf("Hex representation: %x...\n", msgpackBytes[:min(30, len(msgpackBytes))])

	fmt.Println("\n=== MessagePack Decoding ===")
	var decoded User
	err = msgpack.Unmarshal(msgpackBytes, &decoded)
	if err != nil {
		panic(err)
	}
	decodedJSON, _ := json.MarshalIndent(decoded, "", "  ")
	fmt.Println(string(decodedJSON))

	fmt.Println("\n=== Size Comparison ===")
	jsonCompactBytes, _ := json.Marshal(user)
	fmt.Printf("JSON size:        %d bytes\n", len(jsonCompactBytes))
	fmt.Printf("MessagePack size: %d bytes\n", len(msgpackBytes))
	compression := (1 - float64(len(msgpackBytes))/float64(len(jsonCompactBytes))) * 100
	fmt.Printf("Compression:      %.1f%% smaller\n", compression)

	fmt.Println("\n=== Round-trip Verification ===")
	roundTripBytes, _ := msgpack.Marshal(&decoded)
	var roundTrip User
	msgpack.Unmarshal(roundTripBytes, &roundTrip)
	fmt.Printf("Data preserved: %v\n", user == roundTrip)

	fmt.Println("\n=== Performance Test ===")
	iterations := 10000
	largeData := make([]User, 100)
	for i := 0; i < 100; i++ {
		largeData[i] = User{
			ID:       i,
			Username: fmt.Sprintf("user_%d", i),
			Tags:     []string{"tag1", "tag2"},
			Active:   i%2 == 0,
			Balance:  float64(i) * 123.45,
		}
	}

	fmt.Printf("Encoding %d times...\n", iterations)
	startJSON := time.Now()
	for i := 0; i < iterations; i++ {
		json.Marshal(largeData)
	}
	jsonEncodeTime := time.Since(startJSON)

	startMsgpack := time.Now()
	for i := 0; i < iterations; i++ {
		msgpack.Marshal(largeData)
	}
	msgpackEncodeTime := time.Since(startMsgpack)

	fmt.Printf("JSON encoding:        %v\n", jsonEncodeTime)
	fmt.Printf("MessagePack encoding: %v\n", msgpackEncodeTime)
	fmt.Printf("MessagePack is %.1fx faster\n", float64(jsonEncodeTime)/float64(msgpackEncodeTime))

	fmt.Printf("\nDecoding %d times...\n", iterations)
	jsonEncoded, _ := json.Marshal(largeData)
	msgpackEncoded, _ := msgpack.Marshal(largeData)

	startJSONDecode := time.Now()
	for i := 0; i < iterations; i++ {
		var result []User
		json.Unmarshal(jsonEncoded, &result)
	}
	jsonDecodeTime := time.Since(startJSONDecode)

	startMsgpackDecode := time.Now()
	for i := 0; i < iterations; i++ {
		var result []User
		msgpack.Unmarshal(msgpackEncoded, &result)
	}
	msgpackDecodeTime := time.Since(startMsgpackDecode)

	fmt.Printf("JSON decoding:        %v\n", jsonDecodeTime)
	fmt.Printf("MessagePack decoding: %v\n", msgpackDecodeTime)
	fmt.Printf("MessagePack is %.1fx faster\n", float64(jsonDecodeTime)/float64(msgpackDecodeTime))

	fmt.Println("\n=== Special Values ===")
	type SpecialValues struct {
		NullPointer *string   `json:"nullPointer" msgpack:"nullPointer"`
		EmptyString string    `json:"emptyString" msgpack:"emptyString"`
		EmptyArray  []string  `json:"emptyArray" msgpack:"emptyArray"`
		ZeroValue   int       `json:"zeroValue" msgpack:"zeroValue"`
		LargeNumber int64     `json:"largeNumber" msgpack:"largeNumber"`
		Negative    int       `json:"negative" msgpack:"negative"`
		Float       float64   `json:"float" msgpack:"float"`
	}

	special := SpecialValues{
		NullPointer: nil,
		EmptyString: "",
		EmptyArray:  []string{},
		ZeroValue:   0,
		LargeNumber: 9007199254740991,
		Negative:    -42,
		Float:       3.14159,
	}

	specialEncoded, _ := msgpack.Marshal(&special)
	var specialDecoded SpecialValues
	msgpack.Unmarshal(specialEncoded, &specialDecoded)

	originalJSON, _ := json.MarshalIndent(special, "", "  ")
	decodedJSON2, _ := json.MarshalIndent(specialDecoded, "", "  ")
	fmt.Println("Original:")
	fmt.Println(string(originalJSON))
	fmt.Println("Decoded:")
	fmt.Println(string(decodedJSON2))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
