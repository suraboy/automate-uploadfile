#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

const TAAutomation = require('./src/taAutomation');
const config = require('./config');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
const customFolder = args.find(arg => arg.startsWith('--folder='))?.split('=')[1];
const customUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1];

// Configuration overrides
const finalConfig = { ...config };

if (customFolder) {
  finalConfig.pdfFolder = customFolder;
}

if (customUrl) {
  finalConfig.baseUrl = customUrl;
}

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No files will be moved or uploaded');
  finalConfig.browser = {
    ...finalConfig.browser,
    headless: false,
    slowMo: 1000
  };
}

// Display configuration
console.log('🔧 Configuration:');
console.log(`   Base URL: ${finalConfig.baseUrl}`);
console.log(`   PDF Folder: ${path.resolve(finalConfig.pdfFolder)}`);
console.log(`   Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`);
console.log(`   Headless: ${finalConfig.browser.headless ? 'Yes' : 'No'}`);
console.log(`   Screenshots: ${finalConfig.debug.enableScreenshots ? 'Enabled' : 'Disabled'}`);
console.log('');

// Validate configuration
if (finalConfig.baseUrl === 'https://your-domain.com') {
  console.error('❌ ERROR: Please set your TA Summary URL');
  console.log('   Option 1: Set TA_SUMMARY_URL in .env file');
  console.log('   Option 2: Use --url parameter: node run.js --url=https://your-domain.com');
  console.log('   Option 3: Copy .env.example to .env and update it');
  process.exit(1);
}

// Run the automation
async function main() {
  const automation = new TAAutomation(finalConfig);
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN: The automation will run but no changes will be made');
    console.log('   - Files will not be moved to done folder');
    console.log('   - Browser will run in visible mode');
    console.log('   - Operations will be slower for observation');
    console.log('');
  }
  
  await automation.run();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = main;