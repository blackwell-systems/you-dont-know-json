# Chapter 3: JSON Schema - JavaScript Examples

Complete, runnable examples demonstrating JSON Schema validation patterns.

## Setup

```bash
npm install
```

## Examples

### 02-validation-system.js

Complete validation system with Ajv showing:
- Schema definition with multiple constraints
- Format validation (email, URI)
- Error collection and formatting
- Required field validation
- Additional properties prevention

**Run:**
```bash
node 02-validation-system.js
```

**Expected output:**
- Valid user passes validation
- Invalid user shows multiple field-level errors
- Missing required fields caught

## Dependencies

- `ajv` - JSON Schema validator
- `ajv-formats` - Format validators (email, uri, date, etc.)
- `ajv-errors` - Better error messages
- `express` - Web framework for API examples

## Book Reference

These examples correspond to Chapter 3, Section "Validation in Practice: Code Examples" (pages ~230-260 in PDF).

## Next Steps

After understanding basic validation, explore:
- `03-express-validation.js` - API middleware integration
- `../go/01-basic-validation/` - Go validation patterns
- `../python/02-pydantic-validation.py` - Python type-safe validation
