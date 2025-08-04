#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

interface PathConfig {
  tsFile: string;
  name: string;
}

function parseArguments(): PathConfig {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: bun path <ts-file> <name>');
    console.error('Example: bun path src/components/Button.tsx Button');
    process.exit(1);
  }
  
  const [tsFile, name] = args;
  
  // Validate that the .ts file exists
  const fullPath = resolve(tsFile);
  if (!existsSync(fullPath)) {
    console.error(`Error: File ${tsFile} does not exist`);
    process.exit(1);
  }
  
  if (!tsFile.endsWith('.ts') && !tsFile.endsWith('.tsx')) {
    console.error('Error: File must be a .ts or .tsx file');
    process.exit(1);
  }
  
  return { tsFile, name };
}

function updatePackageJson(tsFile: string, name: string): void {
  const packageJsonPath = join(process.cwd(), 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.error('Error: package.json not found in current directory');
    process.exit(1);
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Initialize exports if it doesn't exist
    if (!packageJson.exports) {
      packageJson.exports = {};
    }
    
    // Add the new path
    const relativePath = tsFile.startsWith('./') ? tsFile : `./${tsFile}`;
    packageJson.exports[`./${name}`] = relativePath;
    
    // Write back to file
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Added path to package.json: "./${name}" -> "${relativePath}"`);
  } catch (error) {
    console.error('Error updating package.json:', error);
    process.exit(1);
  }
}

function updateTsConfig(tsFile: string, name: string): void {
  const tsConfigPath = join(process.cwd(), 'tsconfig.json');
  
  if (!existsSync(tsConfigPath)) {
    console.error('Error: tsconfig.json not found in current directory');
    process.exit(1);
  }
  
  try {
    // Read the file content and remove comments for parsing
    const fileContent = readFileSync(tsConfigPath, 'utf8');
    const jsonContent = fileContent.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    const tsConfig = JSON.parse(jsonContent);
    
    // Initialize paths if it doesn't exist
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    if (!tsConfig.compilerOptions.paths) {
      tsConfig.compilerOptions.paths = {};
    }
    
    // Add the new path
    const relativePath = tsFile.startsWith('./') ? tsFile : `./${tsFile}`;
    tsConfig.compilerOptions.paths[name] = [relativePath];
    
    // Write back to file with proper formatting
    const updatedContent = JSON.stringify(tsConfig, null, 2);
    writeFileSync(tsConfigPath, updatedContent + '\n');
    console.log(`✅ Added path to tsconfig.json: "${name}" -> ["${relativePath}"]`);
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
    process.exit(1);
  }
}

function main(): void {
  console.log('🔧 Path CLI - Adding TypeScript paths to package.json and tsconfig.json\n');
  
  const { tsFile, name } = parseArguments();
  
  console.log(`📁 TypeScript file: ${tsFile}`);
  console.log(`🏷️  Name: ${name}\n`);
  
  updatePackageJson(tsFile, name);
  updateTsConfig(tsFile, name);
  
  console.log('\n🎉 Successfully updated both package.json and tsconfig.json!');
  console.log(`\nYou can now import using: import { ... } from '${name}'`);
}

if (require.main === module) {
  main();
}
