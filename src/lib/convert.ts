import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join, extname, dirname, basename } from 'path';
import sharp from 'sharp';
import { glob } from 'glob';
import pLimit from 'p-limit';
import chalk from 'chalk';

export interface ConvertOptions {
  src: string;
  quality: number;
  lossless: boolean;
  overwrite: boolean;
  threads: number;
  preserveMeta: boolean;
  flat?: string;
}

export interface ConvertResult {
  converted: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
  originalKB: number;
  webpKB: number;
  savings: number;
}

export class WebPConverter {
  private cwebpAvailable: boolean | null = null;

  async checkCWebP(): Promise<boolean> {
    if (this.cwebpAvailable !== null) return this.cwebpAvailable;
    
    try {
      await new Promise((resolve, reject) => {
        const child = spawn('cwebp', ['-version'], { stdio: 'pipe' });
        child.on('error', reject);
        child.on('close', (code) => code === 0 ? resolve(void 0) : reject());
      });
      this.cwebpAvailable = true;
      console.log(chalk.green('✓ Using cwebp (Google WebP tools)'));
    } catch {
      this.cwebpAvailable = false;
      console.log(chalk.yellow('⚠ cwebp not found, falling back to sharp'));
    }
    
    return this.cwebpAvailable;
  }

  async findImages(srcDir: string): Promise<string[]> {
    const patterns = ['**/*.{png,jpg,jpeg,PNG,JPG,JPEG}'];
    const files = await glob(patterns, { cwd: srcDir, absolute: true });
    return files;
  }

  async convertWithCWebP(inputPath: string, outputPath: string, options: ConvertOptions): Promise<void> {
    const args = [inputPath, '-o', outputPath];
    
    if (options.lossless) {
      args.push('-lossless');
    } else {
      args.push('-q', options.quality.toString());
    }
    
    if (options.preserveMeta) {
      args.push('-metadata', 'exif,icc');
    }

    await new Promise<void>((resolve, reject) => {
      const child = spawn('cwebp', args, { stdio: 'pipe' });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`cwebp exit code: ${code}`));
      });
    });
  }

  async convertWithSharp(inputPath: string, outputPath: string, options: ConvertOptions): Promise<void> {
    let sharpInstance = sharp(inputPath);
    
    if (options.preserveMeta) {
      sharpInstance = sharpInstance.withMetadata();
    }
    
    const webpOptions: sharp.WebpOptions = {
      quality: options.lossless ? undefined : options.quality,
      lossless: options.lossless
    };
    
    await sharpInstance.webp(webpOptions).toFile(outputPath);
  }

  async convertSingle(inputPath: string, options: ConvertOptions): Promise<{ success: boolean; error?: string; originalSize: number; webpSize: number }> {
    try {
      const inputStat = await fs.stat(inputPath);
      const originalSize = inputStat.size;
      
      let outputPath: string;
      if (options.flat) {
        await fs.mkdir(options.flat, { recursive: true });
        const filename = basename(inputPath, extname(inputPath)) + '.webp';
        outputPath = join(options.flat, filename);
      } else if (options.overwrite) {
        outputPath = inputPath.replace(/\.(png|jpe?g)$/i, '.webp');
      } else {
        const dir = dirname(inputPath);
        const name = basename(inputPath, extname(inputPath));
        outputPath = join(dir, `${name}.webp`);
      }

      const canUseCWebP = await this.checkCWebP();
      
      if (canUseCWebP) {
        await this.convertWithCWebP(inputPath, outputPath, options);
      } else {
        await this.convertWithSharp(inputPath, outputPath, options);
      }
      
      // Clean up original if overwrite is true and we're not already a webp
      if (options.overwrite && !inputPath.toLowerCase().endsWith('.webp')) {
        await fs.unlink(inputPath);
      }
      
      const webpStat = await fs.stat(outputPath);
      const webpSize = webpStat.size;
      
      return { success: true, originalSize, webpSize };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        originalSize: 0,
        webpSize: 0
      };
    }
  }

  async batchConvert(options: ConvertOptions): Promise<ConvertResult> {
    console.log(chalk.blue(`🔍 Scanning ${options.src} for images...`));
    
    const images = await this.findImages(options.src);
    const limit = pLimit(options.threads);
    
    console.log(chalk.blue(`📁 Found ${images.length} images`));
    console.log(chalk.blue(`🚀 Converting with ${options.threads} threads...`));
    
    const result: ConvertResult = {
      converted: [],
      skipped: [],
      errors: [],
      originalKB: 0,
      webpKB: 0,
      savings: 0
    };

    const tasks = images.map(imagePath => 
      limit(async () => {
        const convertResult = await this.convertSingle(imagePath, options);
        
        if (convertResult.success) {
          result.converted.push(imagePath);
          result.originalKB += convertResult.originalSize / 1024;
          result.webpKB += convertResult.webpSize / 1024;
          console.log(chalk.green(`✓ ${basename(imagePath)}`));
        } else {
          result.errors.push({ file: imagePath, error: convertResult.error || 'Unknown error' });
          console.log(chalk.red(`✗ ${basename(imagePath)}: ${convertResult.error}`));
        }
      })
    );

    await Promise.all(tasks);
    
    result.savings = result.originalKB > 0 ? 
      Math.round(((result.originalKB - result.webpKB) / result.originalKB) * 100) : 0;
    
    return result;
  }
}