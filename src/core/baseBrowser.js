const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');

/**
 * Base Browser Management Class
 * Handles browser initialization, cleanup, and basic operations with session management
 */
class BaseBrowser {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
    this.sessionFile = path.join(__dirname, '../../.session/browser-session.json');
  }

  async init() {
    console.log('🚀 Initializing browser...');
    
    // Try to load existing session
    const sessionData = await this.loadSession();
    
    this.browser = await chromium.launch({
      headless: this.config.browser.headless,
      slowMo: this.config.browser.slowMo,
      args: ['--start-maximized']
    });
    
    // Create new context with session data if available
    const contextOptions = {
      viewport: null // Use full screen
    };
    
    if (sessionData) {
      console.log('🔄 Restoring browser session...');
      contextOptions.storageState = sessionData;
    }
    
    const context = await this.browser.newContext(contextOptions);
    this.page = await context.newPage();
    this.page.setDefaultTimeout(this.config.browser.timeout);
    
    // Add error handling for page crashes
    this.page.on('crash', () => {
      console.error('💥 Page crashed! Attempting to recover...');
    });
  }

  async loadSession() {
    try {
      if (await fs.pathExists(this.sessionFile)) {
        const sessionData = await fs.readJson(this.sessionFile);
        console.log('📂 Found existing browser session');
        return sessionData;
      }
    } catch (error) {
      console.log('⚠️ Could not load session:', error.message);
    }
    return null;
  }

  async saveSession() {
    try {
      // Ensure session directory exists
      await fs.ensureDir(path.dirname(this.sessionFile));
      
      // Save current session state
      const sessionData = await this.page.context().storageState();
      await fs.writeJson(this.sessionFile, sessionData);
      console.log('💾 Browser session saved');
    } catch (error) {
      console.log('⚠️ Could not save session:', error.message);
    }
  }

  async clearSession() {
    try {
      if (await fs.pathExists(this.sessionFile)) {
        await fs.remove(this.sessionFile);
        console.log('🗑️ Browser session cleared');
      }
    } catch (error) {
      console.log('⚠️ Could not clear session:', error.message);
    }
  }

  async cleanup(saveSession = true) {
    try {
      // Save session before closing if requested
      if (saveSession && this.page && !this.page.isClosed()) {
        await this.saveSession();
      }
      
      if (this.browser && this.browser.isConnected()) {
        // Force close browser quickly
        await Promise.race([
          this.browser.close(),
          new Promise(resolve => setTimeout(resolve, 1000)) // Max 1 second
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