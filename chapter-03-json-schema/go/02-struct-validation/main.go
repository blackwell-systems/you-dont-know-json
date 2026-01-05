package main

import (
	"encoding/json"
	"fmt"

	"github.com/go-playground/validator/v10"
)

type User struct {
	Username string   `json:"username" validate:"required,min=3,max=20,alphanum"`
	Email    string   `json:"email" validate:"required,email"`
	Age      int      `json:"age" validate:"omitempty,min=0,max=150"`
	Tags     []string `json:"tags" validate:"omitempty,max=10,dive,min=1"`
}

var validate *validator.Validate

func init() {
	validate = validator.New()
}

func validateUser(data []byte) (*User, error) {
	var user User
	
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, fmt.Errorf("JSON parse error: %w", err)
	}
	
	if err := validate.Struct(user); err != nil {
		return nil, err
	}
	
	return &user, nil
}

func printValidationErrors(err error) {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, fieldErr := range validationErrors {
			fmt.Printf("  - Field '%s' failed validation: %s\n", 
				fieldErr.Field(), 
				fieldErr.Tag())
			
			switch fieldErr.Tag() {
			case "required":
				fmt.Printf("    (field is required)\n")
			case "email":
				fmt.Printf("    (must be valid email format)\n")
			case "min":
				fmt.Printf("    (minimum value: %s)\n", fieldErr.Param())
			case "max":
				fmt.Printf("    (maximum value: %s)\n", fieldErr.Param())
			case "alphanum":
				fmt.Printf("    (must contain only letters and numbers)\n")
			}
		}
	} else {
		fmt.Printf("  Error: %v\n", err)
	}
}

func main() {
	fmt.Println("=== Valid User ===")
	validData := []byte(`{
		"username": "alice",
		"email": "alice@example.com",
		"age": 30,
		"tags": ["golang", "json"]
	}`)
	
	user, err := validateUser(validData)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	} else {
		fmt.Printf("✓ Valid user: %+v\n", user)
	}

	fmt.Println("\n=== Invalid: Missing Required Field ===")
	missingEmail := []byte(`{
		"username": "bob",
		"age": 25
	}`)
	
	_, err = validateUser(missingEmail)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	}

	fmt.Println("\n=== Invalid: Email Format ===")
	badEmail := []byte(`{
		"username": "carol",
		"email": "not-an-email",
		"age": 28
	}`)
	
	_, err = validateUser(badEmail)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	}

	fmt.Println("\n=== Invalid: Username Too Short ===")
	shortUsername := []byte(`{
		"username": "al",
		"email": "al@example.com"
	}`)
	
	_, err = validateUser(shortUsername)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	}

	fmt.Println("\n=== Invalid: Age Out of Range ===")
	badAge := []byte(`{
		"username": "dave",
		"email": "dave@example.com",
		"age": 200
	}`)
	
	_, err = validateUser(badAge)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	}

	fmt.Println("\n=== Invalid: Too Many Tags ===")
	tooManyTags := []byte(`{
		"username": "eve",
		"email": "eve@example.com",
		"tags": ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11"]
	}`)
	
	_, err = validateUser(tooManyTags)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	}

	fmt.Println("\n=== Invalid: Empty Tag ===")
	emptyTag := []byte(`{
		"username": "frank",
		"email": "frank@example.com",
		"tags": ["valid", ""]
	}`)
	
	_, err = validateUser(emptyTag)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	}

	fmt.Println("\n=== Valid: Optional Fields Omitted ===")
	minimalUser := []byte(`{
		"username": "grace",
		"email": "grace@example.com"
	}`)
	
	user, err = validateUser(minimalUser)
	if err != nil {
		fmt.Println("✗ Validation failed:")
		printValidationErrors(err)
	} else {
		fmt.Printf("✓ Valid user: %+v\n", user)
	}
}
