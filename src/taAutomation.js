const path = require('path');
const BaseBrowser = require('./core/baseBrowser');
const AuthPage = require('./pages/authPage');
const NavigationPage = require('./pages/navigationPage');
const TASummaryPage = require('./pages/taSummaryPage');
const UploadPage = require('./pages/uploadPage');
const FileManager = require('./utils/fileManager');

/**
 * Main TA Automation Class
 * Orchestrates the entire PDF upload process
 */
class TAAutomation extends BaseBrowser {
  constructor(config) {
    super(config);
    this.fileManager = new FileManager(config.pdfFolder);
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  async run() {
    const startTime = Date.now();
    
    try {
      await this.init();
      
      const pdfFiles = await this.fileManager.getPDFFiles();
      this.stats.total = pdfFiles.length;
      
      if (pdfFiles.length === 0) {
        console.log('📂 No PDF files found in the specified folder');
        console.log(`📁 Checked folder: ${path.resolve(this.config.pdfFolder)}`);
        return;
      }
      
      console.log(`📊 Starting automation for ${pdfFiles.length} PDF files`);
      
      const doneFolder = await this.fileManager.ensureDoneFolder();
      const failFolder = await this.fileManager.ensureFailFolder();
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const fileName = pdfFiles[i];
        const filePath = path.join(this.config.pdfFolder, fileName);
        
        console.log(`\n📈 Progress: ${i + 1}/${pdfFiles.length}`);
        
        try {
          await this.processFile(filePath, doneFolder, failFolder);
          
          // Small delay between files
          if (i < pdfFiles.length - 1 && !this.page.isClosed()) {
            await this.page.waitForTimeout(300);
          }
        } catch (error) {
          console.error(`💥 Critical error processing ${fileName}:`, error.message);
          
          // Handle browser crash
          if (this.page.isClosed() || error.message.includes('Target page, context or browser has been closed')) {
            console.log('🔄 Browser crashed, attempting to reinitialize...');
            try {
              await this.cleanup();
              await this.init();
              console.log('✅ Browser reinitialized successfully');
            } catch (reinitError) {
              console.error('❌ Failed to reinitialize browser:', reinitError.message);
              break;
            }
          }
          
          // If only one file, close browser immediately
          if (pdfFiles.length === 1) {
            console.log('🔄 Single file processing failed, closing browser...');
            await this.cleanup();
            break;
          }
          
          console.log('⏭️ Continuing with next file...');
        }
      }
      
      this.printSummary(startTime);
      
    } catch (error) {
      console.error('💥 Fatal error:', error);
      this.stats.errors.push(`Fatal: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  async processFile(filePath, doneFolder, failFolder) {
    const fileName = path.basename(filePath);
    const supplierCodes = this.fileManager.getSupplierCodeFromFilename(fileName);
    
    // Handle multiple suppliers (comma-separated)
    if (Array.isArray(supplierCodes)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Processing: ${fileName} (Multiple Suppliers: ${supplierCodes.join(', ')})`);
      console.log(`${'='.repeat(60)}`);
      
      let allSuccessful = true;
      const failedSuppliers = [];
      
      for (let i = 0; i < supplierCodes.length; i++) {
        const supplierCode = supplierCodes[i];
        console.log(`\n📋 Processing supplier ${i + 1}/${supplierCodes.length}: ${supplierCode}`);
        
        try {
          const success = await this.processSupplier(filePath, supplierCode);
          if (!success) {
            allSuccessful = false;
            failedSuppliers.push(supplierCode);
          }
        } catch (error) {
          console.error(`❌ Error processing supplier ${supplierCode}:`, error.message);
          allSuccessful = false;
          failedSuppliers.push(supplierCode);
          this.stats.errors.push(`${fileName} (${supplierCode}): ${error.message}`);
        }
      }
      
      // Move file based on overall result
      if (allSuccessful) {
        await this.fileManager.moveToProcessed(filePath, doneFolder);
        console.log(`✅ Successfully uploaded ${fileName} to all suppliers: ${supplierCodes.join(', ')}`);
        this.stats.success++;
      } else {
        await this.fileManager.moveToFailed(filePath, failFolder);
        console.log(`❌ Failed to upload ${fileName} to some suppliers: ${failedSuppliers.join(', ')}`);
        this.stats.failed++;
      }
      
    } else {
      // Single supplier (existing logic)
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Processing: ${fileName} (Supplier: ${supplierCodes})`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        const success = await this.processSupplier(filePath, supplierCodes);
        
        if (success) {
          await this.fileManager.moveToProcessed(filePath, doneFolder);
          console.log(`✅ Successfully uploaded ${fileName} to supplier ${supplierCodes}`);
          this.stats.success++;
        } else {
          await this.fileManager.moveToFailed(filePath, failFolder);
          this.stats.failed++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${fileName}:`, error.message);
        this.stats.failed++;
        this.stats.errors.push(`${fileName}: ${error.message}`);
        
        // Take screenshot for debugging
        await this.takeScreenshot(`error_${supplierCodes}_${Date.now()}.png`);
        
        // Move failed file to fail folder
        try {
          await this.fileManager.moveToFailed(filePath, failFolder);
        } catch (moveError) {
          console.log(`⚠️ Could not move ${fileName} to fail folder: ${moveError.message}`);
        }
      }
    }
  }

  async processSupplier(filePath, supplierCode) {
    try {
      // Ensure browser is alive
      if (this.page.isClosed()) {
        throw new Error('Browser page was closed unexpectedly');
      }
      
      // Step 1: Navigate to main page and authenticate (only if needed)
      await this.navigateAndAuthenticate();
      
      // Step 2: Navigate to TA Summary
      const navigation = new NavigationPage(this.page);
      await navigation.navigateToTASummary();
      
      // Step 3: Filter and search for supplier
      const taSummaryPage = new TASummaryPage(this.page, this.config);
      await taSummaryPage.filterAndSearch(supplierCode);
      
      // Step 4: Find approved TA
      const approvedRow = await taSummaryPage.findApprovedTA();
      if (!approvedRow) {
        console.log(`⚠️ No data found for supplier ${supplierCode}`);
        this.stats.skipped++;
        this.stats.errors.push(`${path.basename(filePath)} (${supplierCode}): No data found`);
        
        // Take screenshot for debugging
        await this.takeScreenshot(`no-data-${supplierCode}_${Date.now()}.png`);
        return false;
      }
      
      // Step 5: Select and edit
      await taSummaryPage.selectAndEdit(approvedRow);
      
      // Step 6: Upload PDF
      const uploadPage = new UploadPage(this.page);
      await uploadPage.uploadPDF(filePath);
      
      // Step 7: Save changes
      await uploadPage.saveChanges();
      
      console.log(`✅ Successfully uploaded to supplier ${supplierCode}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error processing supplier ${supplierCode}:`, error.message);
      
      // Take screenshot for debugging
      await this.takeScreenshot(`error_${supplierCode}_${Date.now()}.png`);
      
      throw error;
    }
  }

  async navigateAndAuthenticate() {
    console.log('🌐 Navigating to main page...');
    
    await this.retryOperation(async () => {
      // Navigate to main page
      await this.page.goto(this.config.baseUrl, {
        waitUntil: 'networkidle'
      });
      
      // Handle authentication
      const authPage = new AuthPage(this.page, this.config);
      await authPage.handleAuthentication();
      
      // Ensure dashboard is loaded
      await this.page.waitForTimeout(500);
      
      // Check if we're on the main page with menu
      const dashboardIndicators = [
        'text=Trading Agreement',
        'text=TA',
        '.main-menu',
        '.dashboard'
      ];
      
      let onDashboard = false;
      for (const indicator of dashboardIndicators) {
        if (await this.page.locator(indicator).count() > 0) {
          console.log(`✅ Dashboard loaded - found: ${indicator}`);
          onDashboard = true;
          break;
        }
      }
      
      if (!onDashboard) {
        await this.takeScreenshot('dashboard-not-loaded.png');
        throw new Error('Dashboard not loaded properly');
      }
    });
  }

  printSummary(startTime) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 AUTOMATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total execution time: ${duration} seconds`);
    console.log(`📁 Total files processed: ${this.stats.total}`);
    console.log(`✅ Successful uploads: ${this.stats.success}`);
    console.log(`❌ Failed uploads: ${this.stats.failed}`);
    console.log(`⚠️  Skipped (no approved TA): ${this.stats.skipped}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n📋 Error Details:');
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    const successRate = this.stats.total > 0 ? 
      Math.round((this.stats.success / this.stats.total) * 100) : 0;
    console.log(`\n📊 Success Rate: ${successRate}%`);
    console.log('='.repeat(60));
  }
}

module.exports = TAAutomation;