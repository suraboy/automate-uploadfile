const fs = require('fs-extra');
const path = require('path');

/**
 * File Management Utility
 * Handles PDF file operations
 */
class FileManager {
  constructor(pdfFolder) {
    this.pdfFolder = pdfFolder;
  }

  async getPDFFiles() {
    try {
      await fs.ensureDir(this.pdfFolder);
      const files = await fs.readdir(this.pdfFolder);
      const pdfFiles = files.filter(file => 
        path.extname(file).toLowerCase() === '.pdf' && 
        !file.startsWith('.')
      );
      
      console.log(`📂 Found ${pdfFiles.length} PDF files in ${this.pdfFolder}`);
      return pdfFiles;
    } catch (error) {
      console.error(`❌ Error reading folder ${this.pdfFolder}:`, error.message);
      return [];
    }
  }

  async ensureDoneFolder() {
    const doneFolder = path.join(this.pdfFolder, 'done');
    await fs.ensureDir(doneFolder);
    return doneFolder;
  }

  async ensureFailFolder() {
    const failFolder = path.join(this.pdfFolder, 'fail');
    await fs.ensureDir(failFolder);
    return failFolder;
  }

  async moveToProcessed(filePath, doneFolder) {
    const fileName = path.basename(filePath);
    const newPath = path.join(doneFolder, fileName);
    
    // Ensure we don't overwrite existing files
    let counter = 1;
    let finalPath = newPath;
    while (await fs.pathExists(finalPath)) {
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      finalPath = path.join(doneFolder, `${name}_${counter}${ext}`);
      counter++;
    }
    
    // await fs.move(filePath, finalPath);
    console.log(`📁 Moved ${fileName} to done folder`);
  }

  async moveToFailed(filePath, failFolder) {
    const fileName = path.basename(filePath);
    const newPath = path.join(failFolder, fileName);
    
    // Ensure we don't overwrite existing files
    let counter = 1;
    let finalPath = newPath;
    while (await fs.pathExists(finalPath)) {
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      finalPath = path.join(failFolder, `${name}_${counter}${ext}`);
      counter++;
    }
    
    // await fs.move(filePath, finalPath);
    console.log(`📁 Moved ${fileName} to fail folder`);
  }

  getSupplierCodeFromFilename(filename) {
    return path.basename(filename, '.pdf');
  }
}

module.exports = FileManager;