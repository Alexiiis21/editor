#!/usr/bin/env node

/**
 * Script de verificación del entorno
 * Verifica que todas las dependencias y configuraciones necesarias estén presentes
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, name) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${name} encontrado`, colors.green);
    return true;
  } else {
    log(`✗ ${name} no encontrado`, colors.red);
    return false;
  }
}

function checkDirectory(dirPath, name) {
  const exists = fs.existsSync(dirPath);
  if (exists) {
    log(`✓ Directorio ${name} existe`, colors.green);
    return true;
  } else {
    log(`✗ Directorio ${name} no existe`, colors.yellow);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`  → Directorio ${name} creado`, colors.green);
      return true;
    } catch (error) {
      log(`  → Error creando directorio: ${error.message}`, colors.red);
      return false;
    }
  }
}

async function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        log('✓ FFmpeg disponible globalmente', colors.green);
        resolve(true);
      } else {
        log('✗ FFmpeg no disponible globalmente (usando versión de npm)', colors.yellow);
        resolve(true); // Still ok because we have npm version
      }
    });
    
    ffmpeg.on('error', () => {
      log('ℹ FFmpeg no instalado globalmente (usando @ffmpeg-installer/ffmpeg)', colors.blue);
      resolve(true);
    });
  });
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(envPath);
  
  if (!envExists) {
    log('✗ Archivo .env no encontrado', colors.red);
    log('  → Crea un archivo .env basado en las instrucciones del README', colors.yellow);
    return false;
  }
  
  log('✓ Archivo .env encontrado', colors.green);
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => {
    return !envContent.includes(varName);
  });
  
  if (missingVars.length > 0) {
    log(`  → Variables faltantes: ${missingVars.join(', ')}`, colors.yellow);
  } else {
    log('  → Todas las variables requeridas están presentes', colors.green);
  }
  
  return missingVars.length === 0;
}

async function main() {
  log('\n=== Verificación del Entorno ===\n', colors.blue);
  
  log('Verificando archivos de configuración...', colors.blue);
  checkFile(path.join(__dirname, 'package.json'), 'package.json');
  checkFile(path.join(__dirname, 'next.config.ts'), 'next.config.ts');
  checkFile(path.join(__dirname, 'tsconfig.json'), 'tsconfig.json');
  checkEnvFile();
  
  log('\nVerificando estructura de directorios...', colors.blue);
  checkDirectory(path.join(__dirname, 'uploads'), 'uploads');
  checkDirectory(path.join(__dirname, 'uploads', 'videos'), 'uploads/videos');
  checkDirectory(path.join(__dirname, 'uploads', 'thumbnails'), 'uploads/thumbnails');
  checkDirectory(path.join(__dirname, 'uploads', 'renders'), 'uploads/renders');
  checkDirectory(path.join(__dirname, 'uploads', 'chunks'), 'uploads/chunks');
  
  log('\nVerificando Prisma...', colors.blue);
  checkFile(path.join(__dirname, 'prisma', 'schema.prisma'), 'Prisma schema');
  checkDirectory(path.join(__dirname, 'prisma', 'migrations'), 'Prisma migrations');
  
  log('\nVerificando FFmpeg...', colors.blue);
  await checkFFmpeg();
  
  log('\n=== Verificación Completada ===\n', colors.blue);
  log('Próximos pasos:', colors.green);
  log('1. Si faltan variables de entorno, configura tu archivo .env');
  log('2. Ejecuta "pnpm prisma migrate dev" para configurar la base de datos');
  log('3. Ejecuta "pnpm dev" para iniciar el servidor de desarrollo');
  log('');
}

main().catch(console.error);
