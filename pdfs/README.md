# PDF Files Folder

Place your PDF files here for processing.

## File Naming Convention

Files should be named with the supplier code as the filename:
- `90491.pdf` → Supplier Code: 90491
- `20168.pdf` → Supplier Code: 20168
- `12345.pdf` → Supplier Code: 12345

## Processing

When you run the automation:
1. All PDF files in this folder will be processed
2. Successfully processed files will be moved to the `done/` subfolder
3. Failed files will remain here for manual review

## Example Files

To test the system, you can create sample PDF files:
```bash
# Create sample files (these are just empty files for testing)
touch pdfs/90491.pdf
touch pdfs/20168.pdf
touch pdfs/12345.pdf
```