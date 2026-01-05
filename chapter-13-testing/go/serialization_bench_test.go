package benchmark

import (
	"encoding/json"
	"fmt"
	"testing"

	gojson "github.com/goccy/go-json"
	"github.com/vmihailenco/msgpack/v5"
)

type User struct {
	ID          string            `json:"id" msgpack:"id"`
	Name        string            `json:"name" msgpack:"name"`
	Email       string            `json:"email" msgpack:"email"`
	Age         int               `json:"age" msgpack:"age"`
	Preferences map[string]string `json:"preferences" msgpack:"preferences"`
	Tags        []string          `json:"tags" msgpack:"tags"`
}

func generateTestUsers(count int) []User {
	users := make([]User, count)
	for i := 0; i < count; i++ {
		users[i] = User{
			ID:    fmt.Sprintf("user-%d", i),
			Name:  fmt.Sprintf("User %d", i),
			Email: fmt.Sprintf("user%d@example.com", i),
			Age:   20 + (i % 50),
			Preferences: map[string]string{
				"theme":      "dark",
				"newsletter": "true",
			},
			Tags: []string{fmt.Sprintf("tag-%d", i), "active"},
		}
	}
	return users
}

// Standard library JSON Marshal benchmarks

func BenchmarkStdJSONMarshal(b *testing.B) {
	users := generateTestUsers(1000)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, err := json.Marshal(users)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkStdJSONUnmarshal(b *testing.B) {
	users := generateTestUsers(1000)
	data, _ := json.Marshal(users)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		var result []User
		err := json.Unmarshal(data, &result)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// goccy/go-json benchmarks

func BenchmarkGoccyJSONMarshal(b *testing.B) {
	users := generateTestUsers(1000)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, err := gojson.Marshal(users)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGoccyJSONUnmarshal(b *testing.B) {
	users := generateTestUsers(1000)
	data, _ := gojson.Marshal(users)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		var result []User
		err := gojson.Unmarshal(data, &result)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// MessagePack benchmarks

func BenchmarkMsgPackMarshal(b *testing.B) {
	users := generateTestUsers(1000)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, err := msgpack.Marshal(users)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkMsgPackUnmarshal(b *testing.B) {
	users := generateTestUsers(1000)
	data, _ := msgpack.Marshal(users)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		var result []User
		err := msgpack.Unmarshal(data, &result)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Memory allocation benchmarks

func BenchmarkJSONMarshalMemory(b *testing.B) {
	users := generateTestUsers(1000)
	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		json.Marshal(users)
	}
}

func BenchmarkMsgPackMarshalMemory(b *testing.B) {
	users := generateTestUsers(1000)
	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		msgpack.Marshal(users)
	}
}

// Size comparison tests (not benchmarks, but useful for comparison)

func TestSerializationSizes(t *testing.T) {
	users := generateTestUsers(1000)

	jsonData, _ := json.Marshal(users)
	goccyData, _ := gojson.Marshal(users)
	msgpackData, _ := msgpack.Marshal(users)

	t.Logf("Serialization sizes for 1000 users:")
	t.Logf("  Standard JSON:    %d bytes", len(jsonData))
	t.Logf("  goccy/go-json:    %d bytes", len(goccyData))
	t.Logf("  MessagePack:      %d bytes", len(msgpackData))
	t.Logf("\nSize ratios (vs standard JSON):")
	t.Logf("  goccy/go-json:    %.1f%%", float64(len(goccyData))/float64(len(jsonData))*100)
	t.Logf("  MessagePack:      %.1f%%", float64(len(msgpackData))/float64(len(jsonData))*100)
}

// Parallel benchmarks to simulate concurrent usage

func BenchmarkStdJSONMarshalParallel(b *testing.B) {
	users := generateTestUsers(1000)

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := json.Marshal(users)
			if err != nil {
				b.Fatal(err)
			}
		}
	})
}

func BenchmarkGoccyJSONMarshalParallel(b *testing.B) {
	users := generateTestUsers(1000)

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := gojson.Marshal(users)
			if err != nil {
				b.Fatal(err)
			}
		}
	})
}

// Different payload sizes

func BenchmarkStdJSONMarshalSmall(b *testing.B) {
	users := generateTestUsers(10)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		json.Marshal(users)
	}
}

func BenchmarkStdJSONMarshalLarge(b *testing.B) {
	users := generateTestUsers(10000)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		json.Marshal(users)
	}
}

func BenchmarkGoccyJSONMarshalSmall(b *testing.B) {
	users := generateTestUsers(10)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		gojson.Marshal(users)
	}
}

func BenchmarkGoccyJSONMarshalLarge(b *testing.B) {
	users := generateTestUsers(10000)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		gojson.Marshal(users)
	}
}

// Example benchmark results (from Chapter 13):
// BenchmarkStdJSONMarshal-8        1000    1052847 ns/op   245760 B/op    2001 allocs/op
// BenchmarkGoccyJSONMarshal-8      2000     524123 ns/op   122880 B/op    1001 allocs/op
// BenchmarkMsgPackMarshal-8        3000     351456 ns/op    81920 B/op     501 allocs/op
