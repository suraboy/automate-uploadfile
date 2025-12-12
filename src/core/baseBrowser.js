const { chromium } = require('playwright');

/**
 * Base Browser Management Class
 * Handles browser initialization, cleanup, and basic operations
 */
class BaseBrowser {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: this.config.browser.headless,
      slowMo: this.config.browser.slowMo,
      args: ['--start-maximized']
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(this.config.browser.timeout);
    
    // Add error handling for page crashes
    this.page.on('crash', () => {
      console.error('💥 Page crashed! Attempting to recover...');
    });
  }

  async cleanup() {
    try {
      if (this.browser && this.browser.isConnected()) {
        // Force close browser quickly
        await Promise.race([
          this.browser.close(),
          new Promise(resolve => setTimeout(resolve, 3000)) // Max 3 seconds
        ]);
        console.log('🧹 Browser closed successfully');
      }
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error.message);
      // Force kill if needed
      try {
        if (this.browser) {
          await this.browser.close();
        }
      } catch (e) {
        console.log('⚠️ Force close failed, browser may still be running');
      }
    }
  }

  async ensureBrowserAlive() {
    if (!this.browser || !this.browser.isConnected() || this.page.isClosed()) {
      console.log('🔄 Browser not alive, reinitializing...');
      await this.cleanup();
      await this.init();
      return true;
    }
    return false;
  }

  async retryOperation(operation, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`⚠️ Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
        if (attempt === maxAttempts) throw error;
        await this.page.waitForTimeout(this.config.retry.delayMs);
      }
    }
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`⚠️ Element not found: ${selector}`);
      return false;
    }
  }

  async takeScreenshot(filename) {
    if (this.config.debug?.enableScreenshots && !this.page.isClosed()) {
      try {
        const screenshotPath = `logs/${filename}`;
        await this.page.screenshot({ path: screenshotPath });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (error) {
        console.log('Failed to take screenshot:', error.message);
      }
    }
  }
}

module.exports = BaseBrowser;