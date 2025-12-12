/**
 * Authentication Page Handler
 * Handles SSO login process
 */
class AuthPage {
  constructor(page, config) {
    this.page = page;
    this.config = config;
  }

  async handleAuthentication() {
    if (!this.config.auth?.username || !this.config.auth?.password) {
      console.log('⚠️ No credentials provided, skipping authentication');
      return;
    }

    console.log('🔐 Checking authentication status...');
    
    // Check if already logged in
    const loggedInIndicators = [
      'text=Trading Agreement',
      'text=TA Summary',
      'text=Logout',
      'text=ออกจากระบบ',
      '.main-menu',
      '.dashboard'
    ];
    
    for (const indicator of loggedInIndicators) {
      if (await this.page.locator(indicator).count() > 0) {
        console.log(`✅ Already logged in - found: ${indicator}`);
        return;
      }
    }
    
    console.log('🔐 Not logged in, starting authentication process...');
    
    // Click SSO LOGIN button
    await this.clickSSOLogin();
    
    // Fill login form
    await this.fillLoginForm();
  }

  async clickSSOLogin() {
    console.log('🔍 Looking for SSO LOGIN button...');
    
    const ssoSelectors = [
      'div[role="button"]:has-text("SSO Login")',
      '.mx-name-container24:has-text("SSO Login")',
      'div[tabindex="0"]:has-text("SSO Login")',
      '[role="button"]:has-text("SSO Login")',
      'text=SSO Login'
    ];
    
    let ssoButton = null;
    for (const selector of ssoSelectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        ssoButton = element.first();
        console.log(`✅ Found SSO button: ${selector}`);
        break;
      }
    }
    
    if (!ssoButton) {
      throw new Error('SSO LOGIN button not found');
    }
    
    await ssoButton.click();
    await this.page.waitForTimeout(500);
    console.log('✅ SSO LOGIN clicked');
  }

  async fillLoginForm() {
    console.log('🔍 Looking for login form...');
    await this.page.waitForTimeout(500);
    
    const loginForm = await this.page.locator('form:has(input[type="password"]), input[type="password"]').count();
    
    if (loginForm === 0) {
      throw new Error('Login form not found after clicking SSO button');
    }
    
    console.log('📝 Found login form, entering credentials...');
    
    // Fill username
    const usernameSelectors = [
      'input[type="text"]',
      'input[name*="username"]',
      'input[name*="user"]',
      'input[type="email"]'
    ];
    
    let usernameField = null;
    for (const selector of usernameSelectors) {
      const field = this.page.locator(selector);
      if (await field.count() > 0) {
        usernameField = field.first();
        break;
      }
    }
    
    if (usernameField) {
      await usernameField.fill(this.config.auth.username);
      console.log('✅ Username entered');
    }
    
    // Fill password
    const passwordField = this.page.locator('input[type="password"]').first();
    if (await passwordField.count() > 0) {
      await passwordField.fill(this.config.auth.password);
      console.log('✅ Password entered');
    }
    
    // Submit form
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("เข้าสู่ระบบ")'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = this.page.locator(selector);
        if (await button.count() > 0) {
          await button.first().click();
          console.log(`✅ Login submitted using: ${selector}`);
          submitted = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!submitted) {
      await passwordField.press('Enter');
      console.log('✅ Login submitted using Enter key');
    }
    
    // Wait for login to complete
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
    console.log('✅ Authentication completed');
  }
}

module.exports = AuthPage;