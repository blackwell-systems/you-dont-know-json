# You Don't Know JSON - Code Examples

Complete, runnable code examples from the book **"You Don't Know JSON"** by Dayna Blackwell.

All examples are tested and verified working. Each chapter has its own directory with examples organized by language.

## Repository Structure

```
├── chapter-03-json-schema/     # Schema validation patterns
├── chapter-04-binary-databases/ # JSONB, BSON storage examples
├── chapter-05-binary-apis/     # MessagePack, CBOR, Protocol Buffers
├── chapter-06-json-rpc/        # JSON-RPC server and client
├── chapter-07-json-lines/      # Streaming log processing
├── chapter-08-security/        # JWT, encryption, validation
├── chapter-11-api-design/      # REST API patterns
├── chapter-12-data-pipelines/  # Kafka, streaming, ETL
├── chapter-13-testing/         # Testing strategies
└── chapter-14-future/          # Protocol Buffers, GraphQL
```

## Quick Start by Language

### JavaScript/Node.js

```bash
cd chapter-XX-name/javascript
npm install
node example.js
```

### Go

```bash
cd chapter-XX-name/go
go mod download
go run main.go
```

### Python

```bash
cd chapter-XX-name/python
pip install -r requirements.txt
python example.py
```

### Rust

```bash
cd chapter-XX-name/rust
cargo run
```

## Prerequisites by Language

### JavaScript/Node.js
- Node.js 18+ 
- npm or yarn

### Go
- Go 1.21+

### Python  
- Python 3.11+
- pip

### Rust
- Rust 1.70+
- Cargo

## Running Examples

Each chapter directory contains:
- `README.md` - Chapter-specific setup and explanations
- Language subdirectories with complete, runnable code
- `package.json` / `go.mod` / `requirements.txt` / `Cargo.toml` with dependencies
- Sample data files where needed

## Common Setup Issues

**JavaScript:** If you see "MODULE_NOT_FOUND", run `npm install` in the example directory.

**Go:** If imports fail, run `go mod download` to fetch dependencies.

**Python:** Use a virtual environment to avoid conflicts:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Rust:** First build may be slow as Cargo downloads and compiles dependencies.

## Database Examples

Some examples require databases:

**PostgreSQL** (Chapter 4, 12):
```bash
docker run --name postgres-json -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

**MongoDB** (Chapter 4):
```bash
docker run --name mongo-json -p 27017:27017 -d mongo:7
```

**Redis** (Chapter 12):
```bash
docker run --name redis-json -p 6379:6379 -d redis:7
```

## Testing

Each example includes tests where applicable:

**JavaScript:**
```bash
npm test
```

**Go:**
```bash
go test -v ./...
```

**Python:**
```bash
pytest
```

**Rust:**
```bash
cargo test
```

## Contributing

Found a bug or have an improvement? Open an issue or pull request:
https://github.com/blackwell-systems/you-dont-know-json

## License

Code examples are provided under the MIT License. See individual files for details.

## Book

Purchase the complete book at: [Leanpub link]

## Support

- File issues: https://github.com/blackwell-systems/you-dont-know-json/issues
- Book errata: [Leanpub book page]
- Author blog: https://blackwell-systems.github.io/blog/
