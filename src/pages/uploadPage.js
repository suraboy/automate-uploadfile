const path = require('path');

/**
 * Upload Page Handler
 * Handles PDF upload and saving
 */
class UploadPage {
  constructor(page) {
    this.page = page;
  }

  async uploadPDF(pdfPath) {
    console.log(`📎 Uploading PDF: ${path.basename(pdfPath)}`);
    
    // Look for "Upload new Internal Attachment" button first
    console.log('🔍 Looking for Upload new Internal Attachment button...');
    
    const uploadButtons = [
      // From the popup in screenshot
      'button:has-text("Upload File")',
      'input[type="button"][value="Upload File"]',
      // Original selectors
      'button:has-text("Upload new Internal Attachment")',
      'text=Upload new Internal Attachment',
      'button:has-text("Upload")',
      'button:has-text("อัปโหลด")',
      'a:has-text("Upload")',
      'input[type="button"][value*="Upload"]'
    ];
    
    // First check if there's already a popup with file input
    let fileInput = this.page.locator('input[type="file"]');
    let fileInputCount = await fileInput.count();
    
    console.log(`🔍 Found ${fileInputCount} file input(s) on page`);
    
    // If no file input visible, try to click upload button first
    if (fileInputCount === 0) {
      console.log('🔍 No file input found, looking for upload button...');
      
      for (const buttonSelector of uploadButtons) {
        try {
          console.log(`   Trying: ${buttonSelector}`);
          const button = this.page.locator(buttonSelector);
          const count = await button.count();
          
          if (count > 0) {
            console.log(`✅ Found upload button: ${buttonSelector}`);
            await button.first().click();
            await this.page.waitForTimeout(1000);
            
            // Check if file input appeared
            fileInputCount = await this.page.locator('input[type="file"]').count();
            if (fileInputCount > 0) {
              fileInput = this.page.locator('input[type="file"]');
              console.log(`✅ File input appeared after clicking button`);
              break;
            }
          }
        } catch (error) {
          console.log(`   Error with ${buttonSelector}: ${error.message}`);
          continue;
        }
      }
    }
    
    if (fileInputCount === 0) {
      throw new Error('Could not find file upload input');
    }
    
    // Upload the file
    console.log('📤 Uploading file...');
    await fileInput.first().setInputFiles(pdfPath);
    
    // After selecting file, look for "Upload File" button in popup
    console.log('🔍 Looking for Upload File button in popup...');
    await this.page.waitForTimeout(500);
    
    const uploadFileButton = this.page.locator('button:has-text("Upload File"), input[value="Upload File"]');
    const uploadFileCount = await uploadFileButton.count();
    
    if (uploadFileCount > 0) {
      console.log('✅ Found Upload File button, clicking...');
      await uploadFileButton.first().click();
      await this.page.waitForTimeout(1000);
    } else {
      console.log('⚠️ Upload File button not found, file might be uploaded automatically');
    }
    
    // Wait for upload to complete
    console.log('⏳ Waiting for upload to complete...');
    await this.page.waitForTimeout(1000);
    
    // Look for success indicators including the specific success popup
    const successSelectors = [
      'text=Upload new Additional Document succeed!',
      'text=succeed!',
      'text=success',
      'text=สำเร็จ',
      'text=uploaded',
      'text=complete',
      '.success',
      '.alert-success'
    ];
    
    let uploadSuccess = false;
    for (const selector of successSelectors) {
      if (await this.page.locator(selector).count() > 0) {
        uploadSuccess = true;
        console.log(`✅ Upload success detected: ${selector}`);
        
        // If we see the success popup, click OK to close it
        if (selector.includes('succeed!')) {
          console.log('🔄 Clicking OK to close success popup...');
          
          // Wait for modal to be fully loaded
          await this.page.waitForTimeout(1000);
          
          const okButtonSelectors = [
            // From HTML structure: <button class="btn btn-primary">OK</button> inside .modal-footer
            '.modal-footer button.btn.btn-primary',
            '.modal-footer .btn.btn-primary',
            '.modal-footer button:has-text("OK")',
            // Alternative modal structures
            '.mx-dialog-footer button.btn.btn-primary',
            '.mx-dialog-footer .btn-primary',
            // Generic selectors
            'button.btn.btn-primary:has-text("OK")',
            '.btn-primary:has-text("OK")',
            'button:has-text("OK")',
            // Fallback - any button in modal
            '.modal button',
            '.mx-dialog button'
          ];
          
          let okClicked = false;
          for (const okSelector of okButtonSelectors) {
            try {
              const okButton = this.page.locator(okSelector);
              const count = await okButton.count();
              console.log(`   Trying OK selector: ${okSelector} - found ${count}`);
              
              if (count > 0) {
                // Wait for button to be visible and enabled
                await this.page.waitForTimeout(300);
                
                const isVisible = await okButton.first().isVisible();
                const isEnabled = await okButton.first().isEnabled();
                console.log(`   Button visible: ${isVisible}, enabled: ${isEnabled}`);
                
                if (isVisible && isEnabled) {
                  console.log(`✅ Found OK button: ${okSelector}`);
                  
                  // Try clicking with different methods
                  try {
                    // Method 1: Wait for button to be clickable and click
                    await okButton.first().waitFor({ state: 'visible' });
                    await okButton.first().click({ timeout: 5000 });
                    console.log('✅ OK button clicked successfully');
                    okClicked = true;
                  } catch (clickError) {
                    console.log('⚠️ Regular click failed, trying force click...');
                    
                    try {
                      await okButton.first().click({ force: true, timeout: 5000 });
                      console.log('✅ OK button force clicked');
                      okClicked = true;
                    } catch (forceError) {
                      console.log('⚠️ Force click failed, trying JavaScript click...');
                      
                      try {
                        await okButton.first().evaluate(el => el.click());
                        console.log('✅ OK button clicked via JavaScript');
                        okClicked = true;
                      } catch (jsError) {
                        console.log(`⚠️ All click methods failed: ${jsError.message}`);
                      }
                    }
                  }
                  
                  if (okClicked) {
                    await this.page.waitForTimeout(500);
                    break;
                  }
                }
              }
            } catch (e) {
              console.log(`   Error with ${okSelector}: ${e.message}`);
              continue;
            }
          }
          
          if (!okClicked) {
            console.log('⚠️ OK button click failed, trying keyboard shortcuts...');
            
            try {
              // Try pressing Enter key to close popup
              await this.page.keyboard.press('Enter');
              console.log('✅ Pressed Enter to close popup');
              await this.page.waitForTimeout(300);
              okClicked = true;
            } catch (keyError) {
              console.log('⚠️ Enter failed, trying Escape...');
              try {
                await this.page.keyboard.press('Escape');
                console.log('✅ Pressed Escape to close popup');
                await this.page.waitForTimeout(300);
                okClicked = true;
              } catch (escError) {
                console.log('⚠️ All methods failed, but continuing...');
              }
            }
          }
          
          // Verify modal is closed
          try {
            const modalStillVisible = await this.page.locator('.modal, .mx-dialog').isVisible();
            if (!modalStillVisible) {
              console.log('✅ Success modal closed successfully');
            } else {
              console.log('⚠️ Modal may still be visible');
            }
          } catch (e) {
            console.log('⚠️ Could not verify modal closure');
          }
        }
        break;
      }
    }
    
    if (!uploadSuccess) {
      console.log('⚠️ No explicit success message found, but continuing...');
    }
    
    await this.page.waitForTimeout(500);
    console.log('✅ PDF upload completed');
  }

  async saveChanges() {
    console.log('💾 Saving changes...');
    
    // Find save button (green button from the screenshot)
    const saveSelectors = [
      'button:has-text("Save")',
      'input[type="submit"][value*="Save"]',
      '.btn-success',
      '.save-btn',
      'button[style*="background"]', // Green button might have inline style
      'button.btn.btn-success'
    ];
    
    let saveButton = null;
    for (const selector of saveSelectors) {
      try {
        console.log(`🔍 Looking for save button: ${selector}`);
        const element = this.page.locator(selector);
        const count = await element.count();
        
        if (count > 0) {
          // Check if it's actually a save button by text content
          const text = await element.first().textContent();
          if (text && text.toLowerCase().includes('save')) {
            console.log(`✅ Found save button: ${selector} with text "${text}"`);
            saveButton = element.first();
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!saveButton) {
      console.log('⚠️ Save button not found, trying generic button selector...');
      // Fallback: look for any button that might be save
      const allButtons = await this.page.locator('button').all();
      for (const btn of allButtons) {
        try {
          const text = await btn.textContent();
          if (text && text.toLowerCase().includes('save')) {
            console.log(`✅ Found save button by text: "${text}"`);
            saveButton = btn;
            break;
          }
        } catch (e) {}
      }
    }
    
    if (!saveButton) {
      throw new Error('Save button not found');
    }
    
    // Click save button
    await saveButton.click();
    console.log('🔄 Save button clicked');
    
    // Wait for save to complete
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
    
    // Check for save confirmation or redirect back to TA Summary
    const saveConfirmed = await Promise.race([
      this.page.waitForSelector('text=saved, text=success, .save-success', { timeout: 10000 }),
      this.page.waitForURL('**/ta-summary**', { timeout: 10000 }),
      this.page.waitForSelector('text=TA Summary', { timeout: 10000 }) // Back to main page
    ]).catch(() => null);
    
    if (saveConfirmed) {
      console.log('✅ Changes saved successfully');
    } else {
      console.log('⚠️ Save confirmation not detected, but continuing...');
    }
  }
}

module.exports = UploadPage;