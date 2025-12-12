/**
 * Navigation Page Handler
 * Handles menu navigation to TA Summary
 */
class NavigationPage {
  constructor(page) {
    this.page = page;
  }

  async navigateToTASummary() {
    console.log('📋 Navigating through menu to TA Summary...');
    
    // Wait for main page to load
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300);
    
    // Step 1: Click Trading Agreement menu to expand it
    await this.clickTradingAgreementMenu();
    
    // Step 2: Click Setup submenu (this will navigate to Setup page)
    await this.clickSetupSubmenu();
    
    // Step 3: Click TA Summary button on Setup page
    await this.clickTASummary();
    
    console.log('✅ Successfully navigated to TA Summary page');
  }



  async clickTradingAgreementMenu() {
    console.log('🔍 Looking for Trading Agreement menu...');
    
    // Use the exact selector from the HTML provided by user
    const tradingAgreementSelectors = [
      'a.mx-name-navigationTree3-2.dropbox[title="Trading Agreement"]',
      '.mx-name-navigationTree3-2',
      'a[title="Trading Agreement"]',
      '.dropbox:has-text("Trading Agreement")',
      'text=Trading Agreement'
    ];
    
    let tradingMenuFound = false;
    for (const selector of tradingAgreementSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        console.log(`   Trying: ${selector} - found ${count} elements`);
        
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          if (isVisible) {
            console.log(`✅ Found Trading Agreement menu: ${selector}`);
            await element.first().click();
            await this.page.waitForTimeout(200);
            tradingMenuFound = true;
            break;
          }
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
        continue;
      }
    }
    
    if (!tradingMenuFound) {
      throw new Error('Trading Agreement menu not found');
    }
  }

  async clickSetupSubmenu() {
    console.log('🔍 Looking for Setup submenu...');
    
    // Wait a moment for dropdown to fully appear
    await this.page.waitForTimeout(200);
    
    // Use the exact selector from the HTML provided by user
    const setupMenuSelectors = [
      'a.mx-name-navigationTree3-2-5[title="CPAxtra : Setup"]',
      '.mx-name-navigationTree3-2-5',
      'a[title="CPAxtra : Setup"]',
      '[title*="Setup"]',
      'text=Setup'
    ];
    
    let setupMenuFound = false;
    
    // Try to find Setup submenu (should be visible after Trading Agreement click)
    for (const selector of setupMenuSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        console.log(`   Trying: ${selector} - found ${count} elements`);
        
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          console.log(`   Element visible: ${isVisible}`);
          
          if (isVisible) {
            console.log(`✅ Found Setup submenu: ${selector}`);
            await element.first().click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(500);
            setupMenuFound = true;
            break;
          }
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
        continue;
      }
    }
    
    if (!setupMenuFound) {
      throw new Error('Setup submenu not found');
    }
  }

  async clickTASummary() {
    console.log('🔍 Looking for TA Summary button...');
    
    // Wait for Setup page to load completely
    await this.page.waitForTimeout(300);
    
    // TA Summary should be visible in Transaction Setup section - click directly
    const taSummarySelectors = [
      // From the screenshot, TA Summary is in Transaction Setup section
      'text=TA Summary',
      'a:has-text("TA Summary")',
      '.mx-link:has-text("TA Summary")',
      'a[data-button-id*="actionButton1"]:has-text("TA Summary")',
      '.mx-name-actionButton1'
    ];
    
    let taSummaryFound = false;
    for (const selector of taSummarySelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        const element = this.page.locator(selector);
        const count = await element.count();
        console.log(`   Found ${count} elements`);
        
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          console.log(`   Element visible: ${isVisible}`);
          
          if (isVisible) {
            console.log(`✅ Found TA Summary button: ${selector}`);
            
            // Click directly - should work since we're on the right page
            await element.first().click();
            console.log('🔄 TA Summary button clicked');
            
            // Wait for navigation
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1000);
            
            // Wait for TA Summary page content to load (search form should appear)
            console.log('⏳ Waiting for TA Summary page content to load...');
            try {
              // Wait for search form elements to appear
              await this.page.waitForSelector('input[type="text"], .mx-grid-search-input, label', { timeout: 10000 });
              console.log('✅ TA Summary search form loaded');
            } catch (waitError) {
              console.log('⚠️ Search form not loaded within timeout, continuing...');
              // Take screenshot for debugging
              await this.page.screenshot({ path: 'logs/ta-summary-form-not-loaded.png' });
            }
            
            taSummaryFound = true;
            break;
          }
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
        continue;
      }
    }
    
    if (!taSummaryFound) {
      console.log('❌ TA Summary button not found, taking screenshot...');
      await this.page.screenshot({ path: 'logs/ta-summary-not-found.png' });
      throw new Error('TA Summary button not found with any selector');
    }
  }
}

module.exports = NavigationPage;