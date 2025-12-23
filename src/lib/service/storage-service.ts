import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
      await mkdir(path.join(this.uploadDir, 'videos'), { recursive: true });
      await mkdir(path.join(this.uploadDir, 'thumbnails'), { recursive: true });
      await mkdir(path.join(this.uploadDir, 'renders'), { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  async saveFile(
    buffer: Buffer,
    filename: string,
    type: 'videos' | 'thumbnails' | 'renders' = 'videos'
  ): Promise<string> {
    const filepath = path.join(this.uploadDir, type, filename);
    await writeFile(filepath, buffer);
    return filepath;
  }

  async deleteFile(filepath: string): Promise<void> {
    try {
      await unlink(filepath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  getPublicUrl(filepath: string): string {
    // En producción, esto retornaría una URL pública (S3, CDN, etc.)
    return `/uploads/${path.basename(filepath)}`;
  }

  async saveChunk(
    chunk: Buffer,
    filename: string,
    chunkIndex: number
  ): Promise<string> {
    const chunkDir = path.join(this.uploadDir, 'chunks', filename);
    await mkdir(chunkDir, { recursive: true });
    
    const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}`);
    await writeFile(chunkPath, chunk);
    
    return chunkPath;
  }

  async mergeChunks(filename: string, totalChunks: number): Promise<string> {
    const chunkDir = path.join(this.uploadDir, 'chunks', filename);
    const outputPath = path.join(this.uploadDir, 'videos', filename);
    
    const writeStream = fs.createWriteStream(outputPath);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk-${i}`);
      const chunkBuffer = await fs.promises.readFile(chunkPath);
      writeStream.write(chunkBuffer);
      await unlink(chunkPath);
    }
    
    writeStream.end();
    await fs.promises.rmdir(chunkDir);
    
    return outputPath;
  }
}

export const storageService = new StorageService();