package main

import (
	"fmt"

	"github.com/xeipuuv/gojsonschema"
)

func main() {
	schemaJSON := `{
		"type": "object",
		"properties": {
			"username": {
				"type": "string",
				"minLength": 3,
				"maxLength": 20
			},
			"email": {
				"type": "string",
				"format": "email"
			},
			"age": {
				"type": "integer",
				"minimum": 0,
				"maximum": 150
			}
		},
		"required": ["username", "email"],
		"additionalProperties": false
	}`

	schemaLoader := gojsonschema.NewStringLoader(schemaJSON)

	fmt.Println("=== Valid User ===")
	validData := `{
		"username": "alice",
		"email": "alice@example.com",
		"age": 30
	}`
	validateAndPrint(schemaLoader, validData)

	fmt.Println("\n=== Invalid: Missing Required Field ===")
	missingEmail := `{
		"username": "bob",
		"age": 25
	}`
	validateAndPrint(schemaLoader, missingEmail)

	fmt.Println("\n=== Invalid: Format Violation ===")
	badEmail := `{
		"username": "carol",
		"email": "not-an-email",
		"age": 28
	}`
	validateAndPrint(schemaLoader, badEmail)

	fmt.Println("\n=== Invalid: Length Violation ===")
	shortUsername := `{
		"username": "al",
		"email": "al@example.com"
	}`
	validateAndPrint(schemaLoader, shortUsername)

	fmt.Println("\n=== Invalid: Range Violation ===")
	badAge := `{
		"username": "dave",
		"email": "dave@example.com",
		"age": 200
	}`
	validateAndPrint(schemaLoader, badAge)

	fmt.Println("\n=== Invalid: Additional Properties ===")
	extraProps := `{
		"username": "eve",
		"email": "eve@example.com",
		"age": 35,
		"admin": true
	}`
	validateAndPrint(schemaLoader, extraProps)
}

func validateAndPrint(schemaLoader gojsonschema.JSONLoader, dataJSON string) {
	documentLoader := gojsonschema.NewStringLoader(dataJSON)

	result, err := gojsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		fmt.Printf("Validation error: %v\n", err)
		return
	}

	if result.Valid() {
		fmt.Println("✓ Document is valid")
	} else {
		fmt.Println("✗ Document is invalid:")
		for _, err := range result.Errors() {
			fmt.Printf("  - %s: %s\n", err.Field(), err.Description())
		}
	}
}
