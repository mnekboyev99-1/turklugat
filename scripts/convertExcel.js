import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

// Adjust path relative to the script execution directory (which will be turk-vocab-app)
const excelFilePath = path.resolve('../Turk.xlsx');
const jsonOutputPath = path.resolve('src/data/words.json');

try {
  // Read the file
  const workbook = xlsx.readFile(excelFilePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON array
  // header: 1 means the first row will be keys if not specified, 
  // but let's just get raw array of arrays to see structure or objects
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  
  console.log('Successfully read Excel file. First few rows:');
  console.log(rawData.slice(0, 3));
  
  // Map data to a standardized format
  // We don't know the exact column names yet, so we'll log it first
  // Assuming basic columns based on common vocabulary lists, but we will adapt.
  
  // Create directory if not exists
  const dir = path.dirname(jsonOutputPath);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(jsonOutputPath, JSON.stringify(rawData, null, 2));
  console.log(`Successfully wrote ${rawData.length} rows to ${jsonOutputPath}`);
  
} catch (error) {
  console.error("Error reading or converting Excel file:", error);
}
