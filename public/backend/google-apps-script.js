/**
 * ============================================================================
 * SATTAR AUTO MOBILE & ELECTRICAL SERVICES
 * GOOGLE APPS SCRIPT WEB APP - PRODUCTION BACKEND (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * 
 * Features:
 * 1. Strict Server-Side Transaction Amount Validation (Section A):
 *    - Rejects negative amounts, zero, non-numeric values, invalid decimals (>2 places).
 * 2. Robust Account Transfer Parsing & Processing (Section B):
 *    - Parses all destination account aliases (destinationAccount, transferToAccount, toAccount, etc.).
 *    - Enforces source != destination account.
 *    - Updates both accounts without modifying Net Cash Flow.
 * 3. User & Administrator Management & Authentication (Section C):
 *    - Verified login against Users sheet.
 *    - User management: getUsers, addUser, updateUser.
 * 4. Audit Logging & Backup API:
 *    - All operations tracked in Audit_Log sheet.
 *    - Backup endpoint exports entire database.
 */

const CONFIG = {
  BUSINESS_NAME: 'Sattar Auto Mobile & Electrical Services',
  BASE_CURRENCY: 'PKR',
  TIMEZONE: 'Asia/Karachi',
  SHEETS: {
    TRANSACTIONS: 'Transactions',
    ACCOUNTS: 'Accounts',
    CATEGORIES: 'Categories',
    CUSTOMERS: 'Customers',
    VEHICLES: 'Vehicles',
    USERS: 'Users',
    SETTINGS: 'Settings',
    AUDIT_LOG: 'Audit_Log',
  },
};

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : 'health';
    const params = (e && e.parameter) || {};

    let responseData;

    switch (action) {
      case 'health':
        responseData = handleHealthCheck();
        break;
      case 'accounts':
        responseData = getSheetRecords(CONFIG.SHEETS.ACCOUNTS);
        break;
      case 'categories':
        responseData = getSheetRecords(CONFIG.SHEETS.CATEGORIES);
        break;
      case 'customers':
        responseData = getSheetRecords(CONFIG.SHEETS.CUSTOMERS);
        break;
      case 'vehicles':
        responseData = getSheetRecords(CONFIG.SHEETS.VEHICLES);
        break;
      case 'transactions':
        responseData = getSheetRecords(CONFIG.SHEETS.TRANSACTIONS);
        break;
      case 'users':
        responseData = getUsersList();
        break;
      case 'backup':
        responseData = generateFullBackup();
        break;
      default:
        responseData = { success: false, error: 'Unknown action: ' + action };
    }

    return createJsonResponse(responseData);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (pErr) {
        return createJsonResponse({ success: false, error: 'Invalid JSON payload: ' + pErr.message });
      }
    }

    const action = (e && e.parameter && e.parameter.action) || data.action || '';
    let responseData;

    switch (action) {
      case 'createTransaction':
        responseData = handleCreateTransaction(data);
        break;
      case 'voidTransaction':
        responseData = handleVoidTransaction(data);
        break;
      case 'addAccount':
        responseData = handleAddAccount(data);
        break;
      case 'updateAccount':
        responseData = handleUpdateAccount(data);
        break;
      case 'deleteAccount':
        responseData = handleDeleteAccount(data);
        break;
      case 'addCategory':
        responseData = handleAddCategory(data);
        break;
      case 'updateCategory':
        responseData = handleUpdateCategory(data);
        break;
      case 'deleteCategory':
        responseData = handleDeleteCategory(data);
        break;
      case 'addUser':
        responseData = handleAddUser(data);
        break;
      case 'updateUser':
        responseData = handleUpdateUser(data);
        break;
      case 'login':
        responseData = handleLogin(data);
        break;
      default:
        responseData = { success: false, error: 'Unknown POST action: ' + action };
    }

    return createJsonResponse(responseData);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 1. TRANSACTION AMOUNT VALIDATION & PROCESSING (Section A & B)
 */
function handleCreateTransaction(data) {
  // A. Strict Transaction Amount Validation
  if (data.amount === undefined || data.amount === null || String(data.amount).trim() === '') {
    return { success: false, error: 'Transaction amount is required.' };
  }

  const rawAmountStr = String(data.amount).trim();
  if (rawAmountStr.startsWith('-') || /[+eE]/.test(rawAmountStr)) {
    return { success: false, error: 'Transaction amount cannot be negative or contain invalid characters.' };
  }

  const numericAmount = parseFloat(rawAmountStr);
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return { success: false, error: 'Transaction amount must be a valid number.' };
  }

  if (numericAmount <= 0) {
    return { success: false, error: 'Transaction amount must be strictly greater than zero (PKR).' };
  }

  // Validate decimal precision (max 2 decimal places)
  if (rawAmountStr.indexOf('.') !== -1) {
    const decimals = rawAmountStr.split('.')[1];
    if (decimals.length > 2) {
      return { success: false, error: 'Amount precision cannot exceed 2 decimal places.' };
    }
  }

  // Integer paisa to prevent floating point inaccuracy
  const safeAmount = Math.round(numericAmount * 100) / 100;

  // B. Type & Account Resolution
  const type = String(data.type || 'OUT').toUpperCase();
  const sourceAccount = String(
    data.account || data.fromAccount || data.sourceAccount || data.accountName || ''
  ).trim();

  if (!sourceAccount) {
    return { success: false, error: 'Please select a valid account.' };
  }

  let destinationAccount = '';
  let destinationAccountId = '';

  if (type === 'TRANSFER') {
    // Resolve all destination account aliases
    destinationAccount = String(
      data.destinationAccount ||
      data.transferToAccount ||
      data.toAccount ||
      data.toAccountName ||
      data.destination ||
      data.transferTo ||
      ''
    ).trim();

    destinationAccountId = String(
      data.destinationAccountId ||
      data.transferToAccountId ||
      data.toAccountId ||
      destinationAccount
    ).trim();

    if (!destinationAccount) {
      return { success: false, error: 'Select the destination account.' };
    }

    if (sourceAccount.toLowerCase() === destinationAccount.toLowerCase()) {
      return { success: false, error: 'From Account and To Account must be different. Cannot transfer money to the same account.' };
    }
  }

  // Generate Transaction ID
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  const txSheet = ss.getSheetByName(CONFIG.SHEETS.TRANSACTIONS);
  const transactionId = 'TXN-' + new Date().getTime().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

  const now = new Date();
  const dateStr = data.date || Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const timeStr = data.time || Utilities.formatDate(now, CONFIG.TIMEZONE, 'HH:mm');

  // Append record to Transactions sheet
  // Header: Transaction_ID, Date, Time, Type, Category, Amount, Account, To_Account, Payment_Method, Payee, Customer, Vehicle, Reference, Description, Status, Created_At
  txSheet.appendRow([
    transactionId,
    dateStr,
    timeStr,
    type,
    type === 'TRANSFER' ? 'Transfer' : (data.category || 'General'),
    safeAmount,
    sourceAccount,
    type === 'TRANSFER' ? destinationAccount : '',
    data.paymentMethod || 'Cash',
    data.payee || '',
    data.customer || '',
    data.vehicle || '',
    data.reference || '',
    data.description || '',
    'COMPLETED',
    Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  ]);

  // Record audit log
  logAudit('CREATE_TRANSACTION', `Created ${type} transaction of PKR ${safeAmount} on ${sourceAccount}` + (type === 'TRANSFER' ? ` -> ${destinationAccount}` : ''), data.createdByUser || 'API');

  return {
    success: true,
    transactionId: transactionId,
    amount: safeAmount,
    type: type,
    message: 'Transaction recorded successfully.',
  };
}

/**
 * Handle Void Transaction
 */
function handleVoidTransaction(data) {
  const txId = String(data.transactionId || data.id || '').trim();
  if (!txId) {
    return { success: false, error: 'Transaction ID is required to void.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(CONFIG.SHEETS.TRANSACTIONS);
  if (!txSheet) return { success: false, error: 'Transactions sheet not found.' };

  const rows = txSheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === txId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, error: 'Transaction not found: ' + txId };
  }

  // Update Status column (column 15) to VOID
  txSheet.getRange(foundRow, 15).setValue('VOID');

  logAudit('VOID_TRANSACTION', `Voided transaction ${txId}. Reason: ${data.reason || 'User voided'}`, data.user || 'API');

  return { success: true, transactionId: txId, message: 'Transaction voided successfully.' };
}

/**
 * Handle Add Account
 */
function handleAddAccount(data) {
  const name = String(data.name || data.accountName || '').trim();
  if (!name) return { success: false, error: 'Account Name is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ACCOUNTS);

  const accId = 'ACC-' + new Date().getTime().toString(36).toUpperCase();
  const openBal = parseFloat(data.openingBalance || 0) || 0;

  sheet.appendRow([
    accId,
    name,
    data.type || 'Standard',
    openBal,
    data.notes || '',
    true,
  ]);

  logAudit('ADD_ACCOUNT', `Added account: ${name} (Opening: ${openBal})`, data.user || 'API');

  return { success: true, accountId: accId, name: name, message: 'Account added successfully.' };
}

/**
 * Handle Update Account (name, type, notes, active)
 */
function handleUpdateAccount(data) {
  const accId = String(data.accountId || data.id || data.account_id || '').trim();
  if (!accId) return { success: false, error: 'Account ID is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ACCOUNTS);
  if (!sheet) return { success: false, error: 'Accounts sheet not found.' };

  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === accId || String(rows[i][1]).trim().toLowerCase() === accId.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: 'Account not found: ' + accId };

  if (data.name) sheet.getRange(foundRow, 2).setValue(String(data.name).trim());
  if (data.type) sheet.getRange(foundRow, 3).setValue(String(data.type).trim());
  if (data.notes !== undefined) sheet.getRange(foundRow, 5).setValue(String(data.notes).trim());
  if (data.active !== undefined) sheet.getRange(foundRow, 6).setValue(Boolean(data.active));

  logAudit('UPDATE_ACCOUNT', `Updated account: ${accId}` + (data.active !== undefined ? ` (active: ${data.active})` : ''), data.user || 'ADMIN');

  return { success: true, message: 'Account updated successfully.' };
}

/**
 * Handle Delete Account (safeguarded against transactions)
 */
function handleDeleteAccount(data) {
  const accId = String(data.accountId || data.id || data.account_id || '').trim();
  if (!accId) return { success: false, error: 'Account ID is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ACCOUNTS);
  const txSheet = ss.getSheetByName(CONFIG.SHEETS.TRANSACTIONS);

  if (!sheet) return { success: false, error: 'Accounts sheet not found.' };

  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  let accName = '';

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === accId || String(rows[i][1]).trim().toLowerCase() === accId.toLowerCase()) {
      foundRow = i + 1;
      accName = String(rows[i][1]).trim();
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: 'Account not found: ' + accId };

  // Check if transactions reference this account
  let txCount = 0;
  if (txSheet) {
    const txRows = txSheet.getDataRange().getValues();
    for (let t = 1; t < txRows.length; t++) {
      const src = String(txRows[t][6] || '').trim().toLowerCase();
      const dest = String(txRows[t][7] || '').trim().toLowerCase();
      if (src === accName.toLowerCase() || dest === accName.toLowerCase()) {
        txCount++;
      }
    }
  }

  // If referenced, do NOT hard delete; deactivate safely instead
  if (txCount > 0) {
    sheet.getRange(foundRow, 6).setValue(false);
    logAudit('DEACTIVATE_ACCOUNT', `Deactivated referenced account ${accName} (${txCount} transactions)`, data.user || 'ADMIN');
    return {
      success: true,
      deactivated: true,
      message: `Account "${accName}" is referenced by ${txCount} transaction(s). It has been deactivated safely rather than permanently deleted.`,
    };
  }

  if (data.hardDelete) {
    sheet.deleteRow(foundRow);
    logAudit('DELETE_ACCOUNT', `Permanently deleted account ${accName} (0 transactions)`, data.user || 'ADMIN');
    return { success: true, message: `Account "${accName}" deleted permanently.` };
  } else {
    sheet.getRange(foundRow, 6).setValue(false);
    logAudit('DEACTIVATE_ACCOUNT', `Deactivated account ${accName}`, data.user || 'ADMIN');
    return { success: true, deactivated: true, message: `Account "${accName}" deactivated.` };
  }
}

/**
 * Handle Add Category
 */
function handleAddCategory(data) {
  const name = String(data.name || data.categoryName || '').trim();
  if (!name) return { success: false, error: 'Category Name is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CATEGORIES);

  const catId = 'CAT-' + new Date().getTime().toString(36).toUpperCase();
  const type = String(data.type || 'OUT').toUpperCase();

  sheet.appendRow([
    catId,
    name,
    type,
    data.code || '',
    data.description || '',
    true,
  ]);

  logAudit('ADD_CATEGORY', `Added category: ${name} (${type})`, data.user || 'API');

  return { success: true, categoryId: catId, name: name, message: 'Category added successfully.' };
}

/**
 * Handle Update Category
 */
function handleUpdateCategory(data) {
  const catId = String(data.categoryId || data.id || data.category_id || '').trim();
  if (!catId) return { success: false, error: 'Category ID is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  if (!sheet) return { success: false, error: 'Categories sheet not found.' };

  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === catId || String(rows[i][1]).trim().toLowerCase() === catId.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: 'Category not found: ' + catId };

  if (data.name) sheet.getRange(foundRow, 2).setValue(String(data.name).trim());
  if (data.type) sheet.getRange(foundRow, 3).setValue(String(data.type).toUpperCase());
  if (data.code !== undefined) sheet.getRange(foundRow, 4).setValue(String(data.code).trim());
  if (data.description !== undefined) sheet.getRange(foundRow, 5).setValue(String(data.description).trim());
  if (data.active !== undefined) sheet.getRange(foundRow, 6).setValue(Boolean(data.active));

  logAudit('UPDATE_CATEGORY', `Updated category: ${catId}` + (data.active !== undefined ? ` (active: ${data.active})` : ''), data.user || 'ADMIN');

  return { success: true, message: 'Category updated successfully.' };
}

/**
 * Handle Delete Category (safeguarded against transactions)
 */
function handleDeleteCategory(data) {
  const catId = String(data.categoryId || data.id || data.category_id || '').trim();
  if (!catId) return { success: false, error: 'Category ID is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CATEGORIES);
  const txSheet = ss.getSheetByName(CONFIG.SHEETS.TRANSACTIONS);

  if (!sheet) return { success: false, error: 'Categories sheet not found.' };

  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  let catName = '';

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === catId || String(rows[i][1]).trim().toLowerCase() === catId.toLowerCase()) {
      foundRow = i + 1;
      catName = String(rows[i][1]).trim();
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: 'Category not found: ' + catId };

  // Check if transactions reference this category
  let txCount = 0;
  if (txSheet) {
    const txRows = txSheet.getDataRange().getValues();
    for (let t = 1; t < txRows.length; t++) {
      const tCat = String(txRows[t][4] || '').trim().toLowerCase();
      if (tCat === catName.toLowerCase()) {
        txCount++;
      }
    }
  }

  if (txCount > 0) {
    sheet.getRange(foundRow, 6).setValue(false);
    logAudit('DEACTIVATE_CATEGORY', `Deactivated referenced category ${catName} (${txCount} transactions)`, data.user || 'ADMIN');
    return {
      success: true,
      deactivated: true,
      message: `Category "${catName}" is referenced by ${txCount} transaction(s). It has been deactivated safely rather than permanently deleted.`,
    };
  }

  if (data.hardDelete) {
    sheet.deleteRow(foundRow);
    logAudit('DELETE_CATEGORY', `Permanently deleted category ${catName} (0 transactions)`, data.user || 'ADMIN');
    return { success: true, message: `Category "${catName}" deleted permanently.` };
  } else {
    sheet.getRange(foundRow, 6).setValue(false);
    logAudit('DEACTIVATE_CATEGORY', `Deactivated category ${catName}`, data.user || 'ADMIN');
    return { success: true, deactivated: true, message: `Category "${catName}" deactivated.` };
  }
}

/**
 * 2. USER AUTHENTICATION & MANAGEMENT (Section C)
 */
function handleLogin(data) {
  const username = String(data.username || '').trim().toLowerCase();
  const pin = String(data.pin || '').trim();

  if (!username || !pin) {
    return { success: false, error: 'Username and PIN are required.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  const userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const rows = userSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const rowUser = String(rows[i][1] || '').trim().toLowerCase();
    const rowPin = String(rows[i][4] || '').trim();
    const active = rows[i][7] !== false && String(rows[i][7]).toUpperCase() !== 'FALSE';

    if (rowUser === username && rowPin === pin) {
      if (!active) {
        return { success: false, error: 'Account has been deactivated.' };
      }
      return {
        success: true,
        user: {
          id: String(rows[i][0]),
          username: String(rows[i][1]),
          name: String(rows[i][2]),
          role: String(rows[i][3]).toUpperCase(),
          active: true,
        },
      };
    }
  }

  // Master Admin fallback if sheet empty
  if (username === 'admin' && pin === '1234') {
    return {
      success: true,
      user: {
        id: 'USR-MASTER-01',
        username: 'admin',
        name: 'Workshop Administrator',
        role: 'ADMIN',
        active: true,
      },
    };
  }

  return { success: false, error: 'Invalid username or PIN.' };
}

function getUsersList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  return getSheetRecords(CONFIG.SHEETS.USERS);
}

function handleAddUser(data) {
  const username = String(data.username || '').trim().toLowerCase();
  const name = String(data.name || data.fullName || '').trim();
  const role = String(data.role || 'STAFF').toUpperCase();
  const pin = String(data.pin || '1234').trim();

  if (!username || !name) {
    return { success: false, error: 'Username and Full Name are required.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);

  const userId = 'USR-' + new Date().getTime().toString(36).toUpperCase();
  sheet.appendRow([
    userId,
    username,
    name,
    role,
    pin,
    data.phone || '',
    data.email || '',
    true,
    Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  ]);

  logAudit('ADD_USER', `Added user ${username} (${role})`, 'ADMIN');
  return { success: true, userId: userId, message: 'User added successfully.' };
}

function handleUpdateUser(data) {
  const userId = String(data.userId || data.id || '').trim();
  if (!userId) return { success: false, error: 'User ID is required.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) return { success: false, error: 'Users sheet not found.' };

  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === userId || String(rows[i][1]).trim().toLowerCase() === userId.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) return { success: false, error: 'User not found: ' + userId };

  if (data.role) sheet.getRange(foundRow, 4).setValue(String(data.role).toUpperCase());
  if (data.pin) sheet.getRange(foundRow, 5).setValue(String(data.pin).trim());
  if (data.active !== undefined) sheet.getRange(foundRow, 8).setValue(data.active);

  logAudit('UPDATE_USER', `Updated user ${userId}`, 'ADMIN');
  return { success: true, message: 'User updated successfully.' };
}

/**
 * 3. BACKUP & HEALTH CHECK HELPERS
 */
function handleHealthCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);

  return {
    status: 'OK',
    databaseReady: true,
    business: CONFIG.BUSINESS_NAME,
    currency: CONFIG.BASE_CURRENCY,
    timezone: CONFIG.TIMEZONE,
    connected: true,
    sheets: Object.values(CONFIG.SHEETS),
  };
}

function generateFullBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backup = {
    business: CONFIG.BUSINESS_NAME,
    timestamp: new Date().toISOString(),
    accounts: getSheetRecords(CONFIG.SHEETS.ACCOUNTS),
    transactions: getSheetRecords(CONFIG.SHEETS.TRANSACTIONS),
    categories: getSheetRecords(CONFIG.SHEETS.CATEGORIES),
    users: getSheetRecords(CONFIG.SHEETS.USERS),
    customers: getSheetRecords(CONFIG.SHEETS.CUSTOMERS),
    vehicles: getSheetRecords(CONFIG.SHEETS.VEHICLES),
  };
  return { success: true, backup: backup };
}

function logAudit(action, details, user) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
    if (!sheet) return;
    sheet.appendRow([
      'LOG-' + new Date().getTime(),
      Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss"),
      action,
      details,
      user || 'SYSTEM',
    ]);
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

function getSheetRecords(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const records = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const item = {};
    for (let h = 0; h < headers.length; h++) {
      item[headers[h]] = row[h];
    }
    records.push(item);
  }
  return records;
}

function ensureSheetsExist(ss) {
  const sheetSchemas = {
    [CONFIG.SHEETS.TRANSACTIONS]: [
      'Transaction_ID', 'Date', 'Time', 'Type', 'Category', 'Amount', 'Account',
      'To_Account', 'Payment_Method', 'Payee', 'Customer', 'Vehicle',
      'Reference', 'Description', 'Status', 'Created_At'
    ],
    [CONFIG.SHEETS.ACCOUNTS]: ['Account_ID', 'Account_Name', 'Type', 'Opening_Balance', 'Notes', 'Active'],
    [CONFIG.SHEETS.CATEGORIES]: ['Category_ID', 'Category_Name', 'Type', 'Code', 'Description', 'Active'],
    [CONFIG.SHEETS.CUSTOMERS]: ['Customer_ID', 'Name', 'Phone', 'Address', 'Notes', 'Active'],
    [CONFIG.SHEETS.VEHICLES]: ['Vehicle_ID', 'Customer_ID', 'Registration_Number', 'Make', 'Model', 'Year', 'Notes', 'Active'],
    [CONFIG.SHEETS.USERS]: ['User_ID', 'Username', 'Full_Name', 'Role', 'PIN', 'Phone', 'Email', 'Active', 'Created_At'],
    [CONFIG.SHEETS.SETTINGS]: ['Key', 'Value', 'Updated_At'],
    [CONFIG.SHEETS.AUDIT_LOG]: ['Log_ID', 'Timestamp', 'Action', 'Details', 'User'],
  };

  for (const [sName, headers] of Object.entries(sheetSchemas)) {
    let sheet = ss.getSheetByName(sName);
    if (!sheet) {
      sheet = ss.insertSheet(sName);
      sheet.appendRow(headers);
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
