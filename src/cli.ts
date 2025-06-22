import { Command } from 'commander';
import { cpus } from 'os';
import chalk from 'chalk';
import { WebPConverter } from './lib/convert.js';

const program = new Command();

program
  .name('webp-batch')
  .description('Batch convert images to WebP format')
  .version('1.0.0')
  .option('--src <dir>', 'Source directory to scan for images', '.')
  .option('--quality <number>', 'WebP quality (0-100)', '75')
  .option('--lossless', 'Use lossless encoding (good for PNG)', false)
  .option('--overwrite', 'Replace original files', false)
  .option('--threads <number>', 'Number of concurrent conversions', cpus().length.toString())
  .option('--preserve-meta', 'Preserve EXIF and ICC metadata', false)
  .option('--flat <dir>', 'Output all WebP files to specified directory')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🎨 WebP Batch Converter'));
      console.log(chalk.gray('=========================================='));
      
      const quality = parseInt(options.quality);
      const threads = parseInt(options.threads);
      
      if (isNaN(quality) || quality < 0 || quality > 100) {
        console.error(chalk.red('❌ Quality must be between 0-100'));
        process.exit(1);
      }
      
      if (isNaN(threads) || threads < 1) {
        console.error(chalk.red('❌ Threads must be a positive number'));
        process.exit(1);
      }

      const converter = new WebPConverter();
      const result = await converter.batchConvert({
        src: options.src,
        quality,
        lossless: options.lossless,
        overwrite: options.overwrite,
        threads,
        preserveMeta: options.preserveMeta,
        flat: options.flat
      });

      console.log(chalk.gray('=========================================='));
      console.log(chalk.green.bold('📊 Conversion Report'));
      console.log(chalk.green(`✅ Converted: ${result.converted.length} files`));
      console.log(chalk.yellow(`⏭️  Skipped: ${result.skipped.length} files`));
      console.log(chalk.red(`❌ Errors: ${result.errors.length} files`));
      console.log(chalk.blue(`💾 Original size: ${Math.round(result.originalKB)} KB`));
      console.log(chalk.blue(`🗜️  WebP size: ${Math.round(result.webpKB)} KB`));
      console.log(chalk.green(`💰 Space saved: ${result.savings}%`));

      // Output JSON report
      const jsonReport = JSON.stringify(result, null, 2);
      console.log(chalk.gray('\n📋 JSON Report:'));
      console.log(jsonReport);
      
      process.exit(result.errors.length > 0 ? 1 : 0);
    } catch (error) {
      console.error(chalk.red(`❌ Fatal error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program.parse();