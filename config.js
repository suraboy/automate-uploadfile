// Configuration file for TA Summary automation
require('dotenv').config();

module.exports = {
  // TA Summary domain from environment variable
  baseUrl: process.env.TA_SUMMARY_URL || 'https://your-domain.com',
  
  // Folder containing PDF files to process
  pdfFolder: process.env.PDF_FOLDER || './pdfs',
  
  // Browser settings
  browser: {
    headless: process.env.HEADLESS_MODE === 'true', // Set to true for production runs
    slowMo: parseInt(process.env.BROWSER_SLOW_MO) || 500,     // Milliseconds to slow down operations
    timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 30000   // Default timeout for operations
  },
  
  // Retry settings
  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    delayMs: parseInt(process.env.RETRY_DELAY_MS) || 2000
  },
  
  // Debug settings
  debug: {
    enableScreenshots: process.env.ENABLE_SCREENSHOTS === 'true',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true'
  },
  
  // Authentication (if needed)
  auth: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD
  },
  
  // Search Filter Configuration
  filters: {
    taYear: process.env.TA_YEAR || '2025',
    status: process.env.STATUS_FILTER || 'TA Approved',
    additionalFilters: process.env.ADDITIONAL_FILTERS ? 
      process.env.ADDITIONAL_FILTERS.split(',').map(f => f.trim()) : []
  },
  
  // Selectors based on the actual ASP CMS interface
  selectors: {
    // Navigation
    tradingAgreementMenu: 'text=Trading Agreement, [href*="trading"], .trading-agreement',
    taSummaryLink: 'text=TA Summary, [href*="ta-summary"]',
    
    // Filter form elements
    yearSelect: 'select[name*="year"], select[id*="year"], #TA_year',
    supplierInput: 'input[name*="supplier"], input[id*="supplier"], #Main_Supplier_Code',
    searchButton: 'button:has-text("Search"), input[type="submit"][value*="Search"], #search-btn',
    resetButton: 'button:has-text("Reset"), input[type="submit"][value*="Reset"]',
    
    // Results table
    resultsTable: 'table, .table, #results-table',
    approvedRow: 'tr:has(td:text("TA Approved"))',
    checkbox: 'input[type="checkbox"]',
    
    // Action buttons
    editButton: 'button:has-text("Edit"), input[type="submit"][value*="Edit"], #edit-btn',
    
    // Upload section
    uploadSection: 'text=Internal Attachment, .internal-attachment',
    uploadButton: 'button:has-text("Upload"), a:has-text("Upload"), input[type="file"]',
    fileInput: 'input[type="file"]',
    
    // Save
    saveButton: 'button:has-text("Save"), input[type="submit"][value*="Save"], .btn-success',
    successIndicator: 'text=success, text=uploaded, .success, .alert-success'
  }
};