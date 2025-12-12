# TA Summary PDF Upload Automation

Automated system for uploading PDF files to TA Summary system using Playwright.

## 📁 Project Structure

```
├── src/
│   ├── core/
│   │   └── baseBrowser.js      # Browser management base class
│   ├── pages/
│   │   ├── authPage.js         # SSO authentication handler
│   │   ├── navigationPage.js   # Menu navigation handler
│   │   ├── taSummaryPage.js    # TA Summary page operations
│   │   └── uploadPage.js       # PDF upload and save operations
│   ├── utils/
│   │   └── fileManager.js      # PDF file management utilities
│   └── taAutomation.js         # Main automation orchestrator
├── pdfs/                       # PDF files to upload
│   └── done/                   # Processed files (auto-created)
├── logs/                       # Screenshots and logs (auto-created)
├── config.js                   # Configuration settings
├── run.js                      # Main entry point
└── .env                        # Environment variables
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Add PDF files:**
   - Place PDF files in `pdfs/` folder
   - Filename should be the supplier code (e.g., `12345.pdf`)

4. **Run automation:**
   ```bash
   node run.js
   ```

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# TA Summary System URL
TA_SUMMARY_URL=https://ta-uat.cpaxtra.co.th

# Authentication
USERNAME=your_username
PASSWORD=your_password

# Browser Settings
HEADLESS_MODE=false
BROWSER_SLOW_MO=500
DEFAULT_TIMEOUT=30000

# Debug Settings
ENABLE_SCREENSHOTS=true
VERBOSE_LOGGING=false

# File Settings
PDF_FOLDER=./pdfs
```

### Command Line Options
```bash
# Dry run mode (no actual changes)
node run.js --dry-run

# Custom PDF folder
node run.js --folder=/path/to/pdfs

# Custom URL
node run.js --url=https://your-domain.com
```

## 🔄 Process Flow

1. **Authentication** - SSO login with credentials
2. **Navigation** - Trading Agreement → Setup → TA Summary
3. **Search** - Filter by year (2025) and supplier code
4. **Selection** - Find "TA Approved" status and select
5. **Upload** - Upload PDF file to Internal Attachment
6. **Save** - Save changes and move file to done folder

## 📊 Features

- **Robust Error Handling** - Automatic retry and recovery
- **Browser Crash Recovery** - Reinitialize browser on crash
- **Progress Tracking** - Real-time progress and statistics
- **File Management** - Automatic file organization
- **Screenshot Debugging** - Capture errors for troubleshooting
- **Modular Architecture** - Easy to extend and maintain

## 🛠️ Development

### Adding New Upload Steps

1. **Create new page class** in `src/pages/`
2. **Extend functionality** in existing classes
3. **Update main flow** in `TAAutomation.js`

### Example: Adding new page handler
```javascript
// src/pages/newPage.js
class NewPage {
  constructor(page) {
    this.page = page;
  }

  async doSomething() {
    // Implementation
  }
}

// Use in taAutomation.js
const newPage = new NewPage(this.page);
await newPage.doSomething();
```

## 📈 Statistics

The automation provides detailed statistics:
- Total files processed
- Successful uploads
- Failed uploads
- Skipped files (no approved TA)
- Success rate percentage
- Execution time

## 🐛 Troubleshooting

### Common Issues

1. **SSO Login Failed**
   - Check credentials in `.env`
   - Verify TA_SUMMARY_URL is correct

2. **Element Not Found**
   - Screenshots saved in `logs/` folder
   - Check if page structure changed

3. **Browser Crash**
   - Automatic recovery implemented
   - Check system resources

### Debug Mode
```bash
# Enable screenshots and verbose logging
ENABLE_SCREENSHOTS=true
VERBOSE_LOGGING=true
node run.js
```

## 📝 License

MIT License - see LICENSE file for details.