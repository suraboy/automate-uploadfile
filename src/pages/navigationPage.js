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
    
    // Step 1: Click Setup in left menu
    await this.clickSetupInLeftMenu();
    
    // Step 2: Click Summary in Setup submenu
    await this.clickSummaryInSetupSubmenu();
    
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
            await this.page.waitForTimeout(300); // Wait for Setup submenu to expand
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

  async clickSetupInLeftMenu() {
    console.log('🔍 Looking for Setup in left menu...');
    
    // Wait for menu to be ready
    await this.page.waitForTimeout(300);
    
    // Look for Setup in the left navigation menu
    const setupSelectors = [
      'text=Setup',
      'a:has-text("Setup")',
      '.mx-link:has-text("Setup")',
      '[title*="Setup"]'
    ];
    
    let setupFound = false;
    for (const selector of setupSelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        const element = this.page.locator(selector);
        const count = await element.count();
        console.log(`   Found ${count} elements`);
        
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          console.log(`   Element visible: ${isVisible}`);
          
          if (isVisible) {
            console.log(`✅ Found Setup in left menu: ${selector}`);
            
            // Click Setup to expand submenu
            await element.first().click();
            console.log('🔄 Setup clicked');
            await this.page.waitForTimeout(300);
            
            setupFound = true;
            break;
          }
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
        continue;
      }
    }
    
    if (!setupFound) {
      console.log('❌ Setup in left menu not found, taking screenshot...');
      await this.page.screenshot({ path: 'logs/setup-left-menu-not-found.png' });
      throw new Error('Setup in left menu not found');
    }
  }

  async clickSummaryInSetupSubmenu() {
    console.log('🔍 Looking for Summary in Setup submenu...');
    
    // Wait for Setup submenu to expand
    await this.page.waitForTimeout(300);
    
    // Look for Summary in the expanded Setup submenu
    const summarySelectors = [
      'text=Summary',
      'a:has-text("Summary")',
      '.mx-link:has-text("Summary")',
      'text=TA Summary',
      'a:has-text("TA Summary")',
      '[title*="Summary"]'
    ];
    
    let summaryFound = false;
    for (const selector of summarySelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        const element = this.page.locator(selector);
        const count = await element.count();
        console.log(`   Found ${count} elements`);
        
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          console.log(`   Element visible: ${isVisible}`);
          
          if (isVisible) {
            console.log(`✅ Found Summary in Setup submenu: ${selector}`);
            
            // Click Summary
            await element.first().click();
            console.log('🔄 Summary clicked');
            
            // Wait for navigation to TA Summary page
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
            
            summaryFound = true;
            break;
          }
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
        continue;
      }
    }
    
    if (!summaryFound) {
      console.log('❌ Summary in Setup submenu not found, taking screenshot...');
      await this.page.screenshot({ path: 'logs/summary-in-setup-submenu-not-found.png' });
      throw new Error('Summary in Setup submenu not found');
    }
  }
}

module.exports = NavigationPage;