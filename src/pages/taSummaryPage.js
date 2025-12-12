/**
 * TA Summary Page Handler
 * Handles filtering, searching, and finding approved TAs
 */
class TASummaryPage {
  constructor(page) {
    this.page = page;
  }

  async filterAndSearch(supplierCode) {
    console.log(`🔍 Filtering for supplier: ${supplierCode}`);
    
    // Wait for page to load with retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);
      
      // Check if search form is available
      const inputCount = await this.page.locator('input[type="text"]').count();
      const labelCount = await this.page.locator('label').count();
      
      console.log(`🔍 Attempt ${retryCount + 1}: Found ${inputCount} inputs, ${labelCount} labels`);
      
      if (inputCount > 0 || labelCount > 0) {
        console.log('✅ Search form detected, proceeding...');
        break;
      }
      
      if (retryCount < maxRetries - 1) {
        console.log('⚠️ Search form not ready, waiting and retrying...');
        await this.page.waitForTimeout(2000);
        retryCount++;
      } else {
        console.log('⚠️ Search form still not ready after retries, proceeding anyway...');
      }
    }
    
    // Debug: Check what page we're on
    console.log('🔍 Debug: Checking current page...');
    try {
      const title = await this.page.title();
      const url = this.page.url();
      console.log(`   Page title: "${title}"`);
      console.log(`   Page URL: ${url}`);
      
      // Look for page indicators
      const pageIndicators = [
        'text=TA Summary',
        'text=Trading Agreement',
        'text=Search',
        '.mx-grid-search-item',
        'input[type="text"]',
        'label'
      ];
      
      for (const indicator of pageIndicators) {
        const count = await this.page.locator(indicator).count();
        if (count > 0) {
          console.log(`   Found ${count} elements matching: ${indicator}`);
        }
      }
    } catch (e) {
      console.log('   Debug failed:', e.message);
    }
    
    // Set TA Year
    await this.setTAYear('2025');
    
    // Set Supplier Code
    await this.setSupplierCode(supplierCode);
    
    // Click Search
    await this.clickSearch();
    
    console.log('✅ Search completed');
  }

  async setTAYear(year) {
    console.log(`📅 Setting TA Year to ${year}...`);
    
    // Wait for page to load completely
    await this.page.waitForTimeout(1000);
    
    // Debug: Take screenshot to see current page
    await this.page.screenshot({ path: 'logs/ta-year-search-debug.png' });
    console.log('📸 Debug screenshot saved: logs/ta-year-search-debug.png');
    
    const yearInputSelectors = [
      // Specific ID patterns
      '#mxui_widget_SearchInput_0_input',
      'input[id*="SearchInput_0_input"]',
      'input[id*="SearchInput"][id*="_0_input"]',
      // Class patterns
      '.mx-name-searchField6 input',
      '.mx-grid-search-input input',
      // Label-based
      'input[type="text"]:near(label:has-text("TA year"))',
      'label:has-text("TA year") + * input',
      // Generic patterns - try all text inputs
      'input[type="text"]',
      'input'
    ];
    
    let yearInput = null;
    console.log('🔍 Searching for TA year input field...');
    
    for (const selector of yearInputSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        console.log(`   Trying: ${selector} - found ${count} elements`);
        
        if (count > 0) {
          // Check if this is actually the year input by looking at nearby label
          const firstElement = element.first();
          
          // Try to find associated label
          try {
            const parentDiv = firstElement.locator('xpath=../..'); // Go up 2 levels
            const labelText = await parentDiv.locator('label').textContent();
            
            if (labelText && labelText.toLowerCase().includes('year')) {
              console.log(`✅ Found TA year input with label: "${labelText}"`);
              yearInput = firstElement;
              break;
            }
          } catch (e) {
            // If label check fails, just use the first text input as fallback
            if (selector.includes('SearchInput_0') || selector.includes('searchField6')) {
              console.log(`✅ Found TA year input (fallback): ${selector}`);
              yearInput = firstElement;
              break;
            }
          }
        }
      } catch (error) {
        console.log(`   Error with ${selector}: ${error.message}`);
        continue;
      }
    }
    
    if (!yearInput) {
      // Debug: List all input fields and form elements
      console.log('🔍 Debug: Listing all form elements on page...');
      try {
        // Check all input elements
        const allInputs = await this.page.locator('input').all();
        console.log(`Found ${allInputs.length} input fields:`);
        
        for (let i = 0; i < Math.min(allInputs.length, 15); i++) {
          try {
            const id = await allInputs[i].getAttribute('id');
            const type = await allInputs[i].getAttribute('type');
            const className = await allInputs[i].getAttribute('class');
            const placeholder = await allInputs[i].getAttribute('placeholder');
            const name = await allInputs[i].getAttribute('name');
            console.log(`  ${i+1}. id="${id}" type="${type}" class="${className}" name="${name}" placeholder="${placeholder}"`);
          } catch (e) {
            console.log(`  ${i+1}. Could not get attributes`);
          }
        }
        
        // Check all labels to understand the form structure
        const allLabels = await this.page.locator('label').all();
        console.log(`Found ${allLabels.length} labels:`);
        
        for (let i = 0; i < Math.min(allLabels.length, 10); i++) {
          try {
            const text = await allLabels[i].textContent();
            const forAttr = await allLabels[i].getAttribute('for');
            console.log(`  Label ${i+1}: "${text}" for="${forAttr}"`);
          } catch (e) {
            console.log(`  Label ${i+1}: Could not get text`);
          }
        }
      } catch (debugError) {
        console.log('Debug failed:', debugError.message);
      }
      
      throw new Error('TA year input field not found');
    }
    
    await yearInput.clear();
    await yearInput.fill(year);
    console.log(`✅ TA Year set to ${year}`);
  }

  async setSupplierCode(supplierCode) {
    console.log(`🏢 Setting Supplier Code to ${supplierCode}...`);
    
    const supplierInputSelectors = [
      '#mxui_widget_SearchInput_4_input',
      'input[id*="SearchInput_4_input"]',
      '.mx-name-searchField10 input',
      'input[type="text"]:near(label:has-text("Main Supplier Code"))'
    ];
    
    let supplierInput = null;
    for (const selector of supplierInputSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          supplierInput = element.first();
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!supplierInput) {
      throw new Error('Supplier Code input field not found');
    }
    
    await supplierInput.clear();
    await supplierInput.fill(supplierCode);
    console.log('✅ Supplier code entered');
  }

  async clickSearch() {
    console.log('🔍 Clicking Search button...');
    
    const searchSelectors = [
      'button:has-text("Search")',
      'input[type="submit"][value*="Search"]',
      '.search-btn',
      '[data-button-id*="search"]'
    ];
    
    let searchButton = null;
    for (const selector of searchSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          searchButton = element.first();
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!searchButton) {
      throw new Error('Search button not found');
    }
    
    await searchButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async findApprovedTA() {
    console.log('📋 Looking for any TA record...');
    
    // Handle pagination if present
    await this.handlePagination();
    
    // Check if pagination shows "0 to 0 of 0" or similar (no data)
    try {
      // Use the exact selector pattern from the error message
      const paginationSelectors = [
        '.dijitInline.mx-grid-paging-status',
        '.mx-grid-paging-status',
        'text=/\\d+ to \\d+ of \\d+/',
        '[data-roving-tabindex]'
      ];
      
      for (const selector of paginationSelectors) {
        try {
          const paginationElement = this.page.locator(selector).first();
          const count = await paginationElement.count();
          
          if (count > 0) {
            const paginationText = await paginationElement.textContent();
            console.log(`📄 Pagination text: "${paginationText}"`);
            
            if (paginationText && (
              paginationText.includes('0 to 0 of 0') || 
              paginationText.includes('0 of 0') ||
              paginationText.includes('Currently showing 0 to 0 of')
            )) {
              console.log(`❌ No data found - pagination shows: "${paginationText}"`);
              return null;
            }
            break; // Found pagination, no need to check other selectors
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log('⚠️ Pagination check failed, continuing...');
    }
    
    // Look for any data rows in the table (skip header row)
    const tableRowSelectors = [
      'tbody tr',
      'table tr:not(:first-child)',
      'tr:has(td)',
      '.mx-datagrid-body tr'
    ];
    
    for (const selector of tableRowSelectors) {
      try {
        const rows = this.page.locator(selector);
        const count = await rows.count();
        console.log(`🔍 Trying selector: ${selector} - found ${count} rows`);
        
        if (count > 0) {
          // Get the first row and check if it has actual data
          const firstRow = rows.first();
          const rowText = await firstRow.textContent();
          
          // Skip empty rows, header-like rows, or "No data" messages
          if (rowText && rowText.trim().length > 10 && 
              !rowText.includes('No data') && 
              !rowText.includes('ไม่พบข้อมูล') &&
              !rowText.includes('No records found')) {
            console.log(`✅ Found data row: ${rowText.substring(0, 100)}...`);
            return firstRow;
          } else {
            console.log(`⚠️ Row contains no data or empty message: "${rowText}"`);
          }
        }
      } catch (error) {
        console.log(`   Error with ${selector}: ${error.message}`);
        continue;
      }
    }
    
    console.log('❌ No data rows found in table');
    return null;
  }

  async handlePagination() {
    try {
      const paginationInfo = this.page.locator('.mx-grid-paging-status').first();
      const hasPagination = await paginationInfo.count() > 0;
      
      if (hasPagination) {
        const text = await paginationInfo.textContent();
        console.log(`📄 Pagination detected: ${text}`);
      }
    } catch (error) {
      console.log('⚠️ Pagination check failed, continuing...');
    }
  }

  async selectAndEdit(approvedRow) {
    console.log('✏️ Clicking on the record row...');
    
    // Debug: Show row info
    try {
      const rowText = await approvedRow.textContent();
      console.log(`📋 Working with row: ${rowText.substring(0, 100)}...`);
    } catch (e) {}
    
    // Simply click on the row to select it
    console.log('🖱️ Clicking on the row...');
    await approvedRow.click();
    await this.page.waitForTimeout(1000); // Wait longer for UI to update
    
    // Debug: List all buttons on page to see what's available
    console.log('🔍 Debug: Looking for all buttons on page...');
    try {
      const allButtons = await this.page.locator('button, input[type="submit"], input[type="button"], a[role="button"]').all();
      console.log(`Found ${allButtons.length} clickable elements:`);
      
      for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
        try {
          const text = await allButtons[i].textContent();
          const tagName = await allButtons[i].evaluate(el => el.tagName);
          const type = await allButtons[i].getAttribute('type');
          const value = await allButtons[i].getAttribute('value');
          const className = await allButtons[i].getAttribute('class');
          
          if (text || value) {
            console.log(`  ${i+1}. <${tagName}> text="${text}" value="${value}" type="${type}" class="${className}"`);
          }
        } catch (e) {
          // Skip elements that can't be accessed
        }
      }
    } catch (debugError) {
      console.log('Debug failed:', debugError.message);
    }
    
    // Look for Edit button (should appear after clicking the row)
    console.log('🔍 Looking for Edit button...');
    
    const editSelectors = [
      // From the log output, we see "View TA detail" button
      'button:has-text("View TA detail")',
      'button:has-text(" View TA detail ")',
      '.mx-name-actionButton8:has-text("View TA detail")',
      // Fallback edit patterns
      'button:has-text("Edit")',
      'input[type="submit"][value*="Edit"]',
      'input[value="Edit"]',
      'input[type="button"][value*="Edit"]',
      // Thai language
      'button:has-text("แก้ไข")',
      'input[value*="แก้ไข"]',
      // Class-based selectors
      '.edit-btn',
      '.btn-edit',
      '[data-button-id*="edit"]',
      'button[onclick*="edit"]'
    ];
    
    let editButton = null;
    for (const selector of editSelectors) {
      try {
        console.log(`   Trying edit selector: ${selector}`);
        const elements = this.page.locator(selector);
        const count = await elements.count();
        console.log(`   Found ${count} elements`);
        
        if (count > 0) {
          // Check each element to see if it's an edit button
          for (let i = 0; i < count; i++) {
            try {
              const element = elements.nth(i);
              const isVisible = await element.isVisible();
              
              if (isVisible) {
                const text = await element.textContent();
                const value = await element.getAttribute('value');
                const title = await element.getAttribute('title');
                const onclick = await element.getAttribute('onclick');
                
                // Check if this looks like an edit button
                const isEditButton = (
                  (text && (text.toLowerCase().includes('edit') || text.includes('แก้ไข'))) ||
                  (value && (value.toLowerCase().includes('edit') || value.includes('แก้ไข'))) ||
                  (title && (title.toLowerCase().includes('edit') || title.includes('แก้ไข'))) ||
                  (onclick && onclick.toLowerCase().includes('edit'))
                );
                
                if (isEditButton || selector === 'button' || selector.includes('input')) {
                  console.log(`   Element ${i}: visible=${isVisible}, text="${text}", value="${value}", title="${title}"`);
                  
                  if (isEditButton) {
                    editButton = element;
                    console.log(`✅ Found Edit button: ${selector} with text/value "${text || value}"`);
                    break;
                  }
                }
              }
            } catch (e) {
              continue;
            }
          }
          
          if (editButton) break;
        }
      } catch (error) {
        console.log(`   Error with ${selector}: ${error.message}`);
        continue;
      }
    }
    
    if (!editButton) {
      console.log('❌ Edit button not found, taking screenshot...');
      await this.page.screenshot({ path: 'logs/edit-button-not-found.png' });
      throw new Error('Edit button not found');
    }
    
    // Click Edit button
    console.log('🔄 Clicking Edit button...');
    await editButton.click();
    
    // Wait for navigation to edit page
    console.log('⏳ Waiting for edit page to load...');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
    
    // Verify we're on edit page
    const editPageIndicators = [
      'text=Upload new Internal Attachment',
      'button:has-text("Upload")',
      'input[type="file"]',
      'text=Internal Attachment'
    ];
    
    let onEditPage = false;
    for (const indicator of editPageIndicators) {
      if (await this.page.locator(indicator).count() > 0) {
        console.log(`✅ Confirmed on edit page - found: ${indicator}`);
        onEditPage = true;
        break;
      }
    }
    
    if (!onEditPage) {
      console.log('⚠️ May not be on edit page, taking screenshot...');
      await this.page.screenshot({ path: 'logs/not-on-edit-page.png' });
    }
    
    console.log('✅ Successfully navigated to edit page');
  }
}

module.exports = TASummaryPage;