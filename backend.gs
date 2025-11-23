// Google Apps Script for Kamra App Backend

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  // 1. Kamra (Pantry)
  let sheet = ss.getSheetByName("Kamra");
  if (!sheet) {
    sheet = ss.insertSheet("Kamra");
    sheet.appendRow(["Name", "Quantity", "Unit", "Category"]);
  }
  const pantryData = sheet.getDataRange().getValues();
  // Remove header
  pantryData.shift(); 
  result.pantryItems = pantryData.map(row => ({
    name: row[0],
    quantity: row[1],
    unit: row[2],
    category: row[3]
  })).filter(item => item.name); // Filter empty rows

  // 2. Bevásárlólista (Shopping List)
  sheet = ss.getSheetByName("Bevásárlólista");
  if (!sheet) {
    sheet = ss.insertSheet("Bevásárlólista");
    sheet.appendRow(["Name", "Quantity", "Unit", "Status"]);
  }
  const shoppingData = sheet.getDataRange().getValues();
  shoppingData.shift();
  result.shoppingList = shoppingData.map(row => ({
    name: row[0],
    quantity: row[1],
    unit: row[2],
    bought: row[3] === "bought"
  })).filter(item => item.name);

  // 3. Receptek (Recipes)
  sheet = ss.getSheetByName("Receptek");
  if (!sheet) {
    sheet = ss.insertSheet("Receptek");
    sheet.appendRow(["ID", "Name", "Category", "Ingredients (JSON)"]);
  }
  const recipeData = sheet.getDataRange().getValues();
  recipeData.shift();
  result.recipes = recipeData.map(row => ({
    id: row[0],
    name: row[1],
    category: row[2],
    ingredients: row[3] ? JSON.parse(row[3]) : []
  })).filter(item => item.name);

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  
  // 1. Save Kamra
  let sheet = ss.getSheetByName("Kamra");
  if (!sheet) sheet = ss.insertSheet("Kamra");
  sheet.clear();
  sheet.appendRow(["Name", "Quantity", "Unit", "Category"]);
  if (data.pantryItems && data.pantryItems.length > 0) {
    const rows = data.pantryItems.map(item => [item.name, item.quantity, item.unit, item.category]);
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  // 2. Save Shopping List
  sheet = ss.getSheetByName("Bevásárlólista");
  if (!sheet) sheet = ss.insertSheet("Bevásárlólista");
  sheet.clear();
  sheet.appendRow(["Name", "Quantity", "Unit", "Status"]);
  if (data.shoppingList && data.shoppingList.length > 0) {
    const rows = data.shoppingList.map(item => [item.name, item.quantity, item.unit, item.bought ? "bought" : "active"]);
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  // 3. Save Recipes
  sheet = ss.getSheetByName("Receptek");
  if (!sheet) sheet = ss.insertSheet("Receptek");
  sheet.clear();
  sheet.appendRow(["ID", "Name", "Category", "Ingredients (JSON)"]);
  if (data.recipes && data.recipes.length > 0) {
    const rows = data.recipes.map(item => [item.id, item.name, item.category, JSON.stringify(item.ingredients)]);
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
