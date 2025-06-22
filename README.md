# WebP Batch Converter

A Model Context Protocol (MCP) server for batch converting images to WebP format with cross-platform support. Works seamlessly with MCP-aware IDEs like Cursor.

## 🌟 Features

- 🖼️ **Batch conversion** of PNG, JPG, and JPEG files to WebP
- 🌍 **Cross-platform** support (macOS, Linux, Windows)
- ⚡ **Multi-threaded** processing for fast conversions
- 🎛️ **Flexible options** including quality control, lossless mode, and metadata preservation
- 📊 **Detailed reporting** with file sizes and savings statistics
- 🔧 **Dual engine support** - prefers Google's cwebp, falls back to Sharp
- 🎯 **MCP integration** for use in AI-powered development environments

## 📦 Installation

### Global Installation
```bash
npm install -g webp-batch-mcp
```

### Local Development
```bash
git clone https://github.com/mhe8mah/webp-batch-mcp.git
cd webp-batch-mcp
npm install
npm run build
```

### Docker
```bash
docker build -t webp-batch .
docker run -v /path/to/images:/data webp-batch
```

## 🚀 Usage

### Command Line Interface

```bash
node dist/cli.js [options]
```

#### Options

- `--src <dir>` - Source directory to scan (default: current directory)
- `--quality <0-100>` - WebP quality setting (default: 75)
- `--lossless` - Use lossless encoding (recommended for PNG)
- `--overwrite` - Replace original files with WebP versions
- `--threads <n>` - Number of concurrent conversions (default: CPU count)
- `--preserve-meta` - Preserve EXIF and ICC metadata
- `--flat <dir>` - Output all WebP files to specified directory

#### Examples

```bash
# Convert all images in current directory
node dist/cli.js

# High quality conversion of specific directory
node dist/cli.js --src ./photos --quality 95 --preserve-meta

# Lossless conversion with overwrite
node dist/cli.js --src ./images --lossless --overwrite

# Batch process to output directory
node dist/cli.js --src ./input --flat ./output --threads 8
```

### MCP Server

The MCP server exposes a single tool: `convert_to_webp`

#### Tool Parameters

```json
{
  "src": "string",          // Source directory (default: ".")
  "quality": "number",      // Quality 0-100 (default: 75)
  "lossless": "boolean",    // Lossless mode (default: false)
  "overwrite": "boolean",   // Replace originals (default: false)
  "threads": "number",      // Concurrent threads (default: CPU count)
  "preserveMeta": "boolean", // Keep metadata (default: false)
  "flat": "string"          // Output directory (optional)
}
```

## ⚙️ How to Add This Server in Cursor

1. Clone and build the project:
```bash
git clone https://github.com/mhe8mah/webp-batch-mcp.git
cd webp-batch-mcp
npm install
npm run build
```

2. Open Cursor Settings
3. Navigate to **Features** → **MCP**
4. Add a new server configuration:

```json
{
  "mcpServers": {
    "webp-batch": {
      "command": "node",
      "args": ["/path/to/webp-batch-mcp/dist/server.js"]
    }
  }
}
```

5. Restart Cursor
6. The `convert_to_webp` tool will be available in your AI conversations

## 🔧 Technical Details

### Conversion Strategy

1. **Primary Engine**: Google's `cwebp` tool (included in libwebp-tools)
   - Fastest performance
   - Best compression
   - Full feature support

2. **Fallback Engine**: Sharp (Node.js)
   - Pure JavaScript implementation
   - No external dependencies
   - Cross-platform compatibility

### Output Behavior

- **Default**: Creates `.webp` files alongside originals
- **Overwrite mode**: Replaces originals with WebP versions
- **Flat mode**: Outputs all WebP files to specified directory
- **Metadata preservation**: Maintains EXIF and ICC profiles when requested

### Performance

- Utilizes all CPU cores by default
- Processes images concurrently using p-limit
- Provides real-time progress feedback
- Reports detailed conversion statistics

## 🛠️ Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

## 📊 Test Results

Verified with real web images:
- **JPEG (35KB → 17KB)**: 51% space savings
- **PNG (7.9KB → 2.8KB)**: 65% space savings  
- **Overall**: 53% average compression

## 📋 Dependencies

### Runtime
- `@modelcontextprotocol/sdk` - MCP server framework
- `sharp` - Image processing fallback
- `chalk` - Colorized terminal output
- `commander` - CLI argument parsing
- `glob` - File pattern matching
- `p-limit` - Concurrency control

### Development
- `typescript` - Type safety
- `tsup` - Fast TypeScript bundler
- `jest` - Testing framework

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 🆘 Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/mhe8mah/webp-batch-mcp/issues).