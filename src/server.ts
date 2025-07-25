import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { cpus } from 'os';
import { WebPConverter } from './lib/convert.js';

class WebPBatchServer {
  private server: Server;
  private converter: WebPConverter;

  constructor() {
    this.converter = new WebPConverter();
    this.server = new Server(
      {
        name: 'webp-batch',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'convert_to_webp',
            description: 'Batch convert images (PNG, JPG, JPEG) to WebP format with customizable options. Recursively scans directories and provides detailed conversion reports.',
            inputSchema: {
              type: 'object',
              properties: {
                src: {
                  type: 'string',
                  description: 'Source directory to scan for images (default: current directory)',
                  default: '.'
                },
                quality: {
                  type: 'number',
                  description: 'WebP quality (0-100, default: 75)',
                  minimum: 0,
                  maximum: 100,
                  default: 75
                },
                lossless: {
                  type: 'boolean',
                  description: 'Use lossless encoding (recommended for PNG images)',
                  default: false
                },
                overwrite: {
                  type: 'boolean',
                  description: 'Replace original files with WebP versions',
                  default: false
                },
                threads: {
                  type: 'number',
                  description: `Number of concurrent conversions (default: ${cpus().length})`,
                  minimum: 1,
                  default: cpus().length
                },
                preserveMeta: {
                  type: 'boolean',
                  description: 'Preserve EXIF and ICC metadata',
                  default: false
                },
                flat: {
                  type: 'string',
                  description: 'Output all WebP files to specified directory (optional)'
                }
              },
              required: []
            }
          }
        ]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'convert_to_webp') {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const args = request.params.arguments as any;
      
      try {
        // Validate and set defaults
        const options = {
          src: args.src || '.',
          quality: args.quality || 75,
          lossless: args.lossless || false,
          overwrite: args.overwrite || false,
          threads: args.threads || cpus().length,
          preserveMeta: args.preserveMeta || false,
          flat: args.flat
        };

        // Validate quality range
        if (options.quality < 0 || options.quality > 100) {
          throw new Error('Quality must be between 0-100');
        }

        // Validate threads
        if (options.threads < 1) {
          throw new Error('Threads must be a positive number');
        }

        const result = await this.converter.batchConvert(options);

        return {
          content: [
            {
              type: 'text',
              text: `WebP Batch Conversion Complete!\n\n` +
                   `📊 Results:\n` +
                   `✅ Converted: ${result.converted.length} files\n` +
                   `⏭️  Skipped: ${result.skipped.length} files\n` +
                   `❌ Errors: ${result.errors.length} files\n` +
                   `💾 Original size: ${Math.round(result.originalKB)} KB\n` +
                   `🗜️  WebP size: ${Math.round(result.webpKB)} KB\n` +
                   `💰 Space saved: ${result.savings}%\n\n` +
                   `📋 Detailed Report:\n${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Conversion failed: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('WebP Batch MCP server running on stdio');

    // Keep the process alive to handle multiple requests
    await new Promise(() => {
      /* intentional noop */
    });
  }
}

const server = new WebPBatchServer();
server.run().catch(console.error);