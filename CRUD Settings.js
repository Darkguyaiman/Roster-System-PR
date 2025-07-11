function doGet() {
  return HtmlService.createHtmlOutputFromFile('CRUDSettings')
    .setTitle('Settings Tab')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

function isCurrentUserAdmin() {
  const userEmail = getCurrentUserEmail();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const adminRange = sheet.getRange('E5:E');
  const adminEmails = adminRange.getValues().flat().filter(String);
  
  return adminEmails.includes(userEmail);
}

function getSettingsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const users = getDataFromRange(sheet, 'B5:C', ['username', 'email']);
  const admins = getDataFromRange(sheet, 'D5:E', ['username', 'email']);
  const rosterTypes = getDataFromRange(sheet, 'J5:J', ['rosterType']);
  const statuses = getDataFromRange(sheet, 'G5:G', ['status']);
  const staffShifts = getDataFromRange(sheet, 'H5:H', ['staffShift']);
  const rosterColors = getDataFromRange(sheet, 'K5:K', ['color']);
  
  const rosters = [];
  const minLength = Math.min(rosterTypes.length, rosterColors.length);
  for (let i = 0; i < minLength; i++) {
    rosters.push({
      type: rosterTypes[i].rosterType,
      color: rosterColors[i].color,
      rowIndex: i + 5 
    });
  }
  
  users.forEach((user, index) => {
    user.rowIndex = index + 5;
  });
  
  statuses.forEach((status, index) => {
    status.rowIndex = index + 5;
  });
  
  staffShifts.forEach((shift, index) => {
    shift.rowIndex = index + 5;
  });
  
  const isAdmin = isCurrentUserAdmin();
  const currentUserEmail = getCurrentUserEmail();
  
  return {
    users: users,
    admins: admins,
    rosters: rosters,
    statuses: statuses,
    staffShifts: staffShifts,
    isAdmin: isAdmin,
    currentUserEmail: currentUserEmail
  };
}

function getDataFromRange(sheet, range, headers) {
  const dataRange = sheet.getRange(range);
  const values = dataRange.getValues();
  
  const filteredValues = values.filter(row => row[0] !== '');
  
  return filteredValues.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function addRosterType(rosterType, color) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can add roster types");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const rosterTypesRange = sheet.getRange('J5:J');
  const rosterTypes = rosterTypesRange.getValues();
  let emptyRowIndex = -1;
  
  for (let i = 0; i < rosterTypes.length; i++) {
    if (!rosterTypes[i][0]) {
      emptyRowIndex = i + 5;
      break;
    }
  }
  
  if (emptyRowIndex === -1) {
    emptyRowIndex = rosterTypes.length + 5;
  }
  
  sheet.getRange(`J${emptyRowIndex}`).setValue(rosterType);
  sheet.getRange(`K${emptyRowIndex}`).setValue(color);
  
  return { success: true, message: "Roster type added successfully" };
}

function updateRosterType(rowIndex, rosterType, color) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can update roster types");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  sheet.getRange(`J${rowIndex}`).setValue(rosterType);
  sheet.getRange(`K${rowIndex}`).setValue(color);
  
  return { success: true, message: "Roster type updated successfully" };
}

function deleteRosterType(rowIndex) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can delete roster types");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const rosterTypesRange = sheet.getRange('J5:J');
  const rosterTypes = rosterTypesRange.getValues();
  const colorsRange = sheet.getRange('K5:K');
  const colors = colorsRange.getValues();
  
  sheet.getRange(`J${rowIndex}`).clearContent();
  sheet.getRange(`K${rowIndex}`).clearContent();
  
  const lastRowWithData = rosterTypes.filter(row => row[0] !== '').length + 4;
  
  if (rowIndex < lastRowWithData) {
    const rangeToCopy = sheet.getRange(`J${rowIndex+1}:J${lastRowWithData}`);
    const valuesToCopy = rangeToCopy.getValues();
    
    for (let i = 0; i < valuesToCopy.length; i++) {
      sheet.getRange(`J${rowIndex+i}`).setValue(valuesToCopy[i][0]);
    }
    
    sheet.getRange(`J${lastRowWithData}`).clearContent();
    
    const colorRangeToCopy = sheet.getRange(`K${rowIndex+1}:K${lastRowWithData}`);
    const colorValuesToCopy = colorRangeToCopy.getValues();
    
    for (let i = 0; i < colorValuesToCopy.length; i++) {
      sheet.getRange(`K${rowIndex+i}`).setValue(colorValuesToCopy[i][0]);
    }
    
    sheet.getRange(`K${lastRowWithData}`).clearContent();
  }
  
  return { success: true, message: "Roster type deleted successfully" };
}

function addUser(username, email) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can add users");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const usersRange = sheet.getRange('B5:B');
  const users = usersRange.getValues();
  let emptyRowIndex = -1;
  
  for (let i = 0; i < users.length; i++) {
    if (!users[i][0]) {
      emptyRowIndex = i + 5;
      break;
    }
  }
  
  if (emptyRowIndex === -1) {
    emptyRowIndex = users.length + 5;
  }
  
  sheet.getRange(`B${emptyRowIndex}`).setValue(username);
  sheet.getRange(`C${emptyRowIndex}`).setValue(email);
  
  return { success: true, message: "User added successfully" };
}

function updateUser(rowIndex, username, email) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can update users");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  sheet.getRange(`B${rowIndex}`).setValue(username);
  sheet.getRange(`C${rowIndex}`).setValue(email);
  
  return { success: true, message: "User updated successfully" };
}

function deleteUser(rowIndex) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can delete users");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const usersRange = sheet.getRange('B5:B');
  const users = usersRange.getValues();
  
  sheet.getRange(`B${rowIndex}`).clearContent();
  sheet.getRange(`C${rowIndex}`).clearContent();
  
  const lastRowWithData = users.filter(row => row[0] !== '').length + 4;
  
  if (rowIndex < lastRowWithData) {
    const usernameRangeToCopy = sheet.getRange(`B${rowIndex+1}:B${lastRowWithData}`);
    const usernameValuesToCopy = usernameRangeToCopy.getValues();
    
    for (let i = 0; i < usernameValuesToCopy.length; i++) {
      sheet.getRange(`B${rowIndex+i}`).setValue(usernameValuesToCopy[i][0]);
    }
    
    sheet.getRange(`B${lastRowWithData}`).clearContent();
    
    const emailRangeToCopy = sheet.getRange(`C${rowIndex+1}:C${lastRowWithData}`);
    const emailValuesToCopy = emailRangeToCopy.getValues();
    
    for (let i = 0; i < emailValuesToCopy.length; i++) {
      sheet.getRange(`C${rowIndex+i}`).setValue(emailValuesToCopy[i][0]);
    }
    
    sheet.getRange(`C${lastRowWithData}`).clearContent();
  }
  
  return { success: true, message: "User deleted successfully" };
}

function addStatus(status) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can add statuses");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const statusesRange = sheet.getRange('G5:G');
  const statuses = statusesRange.getValues();
  let emptyRowIndex = -1;
  
  for (let i = 0; i < statuses.length; i++) {
    if (!statuses[i][0]) {
      emptyRowIndex = i + 5;
      break;
    }
  }
  
  if (emptyRowIndex === -1) {
    emptyRowIndex = statuses.length + 5;
  }
  
  sheet.getRange(`G${emptyRowIndex}`).setValue(status);
  
  return { success: true, message: "Status added successfully" };
}

function updateStatus(rowIndex, status) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can update statuses");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  sheet.getRange(`G${rowIndex}`).setValue(status);
  
  return { success: true, message: "Status updated successfully" };
}

function deleteStatus(rowIndex) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can delete statuses");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const statusesRange = sheet.getRange('G5:G');
  const statuses = statusesRange.getValues();
  
  sheet.getRange(`G${rowIndex}`).clearContent();
  
  const lastRowWithData = statuses.filter(row => row[0] !== '').length + 4;
  
  if (rowIndex < lastRowWithData) {
    const rangeToCopy = sheet.getRange(`G${rowIndex+1}:G${lastRowWithData}`);
    const valuesToCopy = rangeToCopy.getValues();
    
    for (let i = 0; i < valuesToCopy.length; i++) {
      sheet.getRange(`G${rowIndex+i}`).setValue(valuesToCopy[i][0]);
    }
    
    sheet.getRange(`G${lastRowWithData}`).clearContent();
  }
  
  return { success: true, message: "Status deleted successfully" };
}

function addStaffShift(staffShift) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can add staff shifts");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const shiftsRange = sheet.getRange('H5:H');
  const shifts = shiftsRange.getValues();
  let emptyRowIndex = -1;
  
  for (let i = 0; i < shifts.length; i++) {
    if (!shifts[i][0]) {
      emptyRowIndex = i + 5;
      break;
    }
  }
  
  if (emptyRowIndex === -1) {
    emptyRowIndex = shifts.length + 5;
  }
  
  sheet.getRange(`H${emptyRowIndex}`).setValue(staffShift);
  
  return { success: true, message: "Staff shift added successfully" };
}

function updateStaffShift(rowIndex, staffShift) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can update staff shifts");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  sheet.getRange(`H${rowIndex}`).setValue(staffShift);
  
  return { success: true, message: "Staff shift updated successfully" };
}

function deleteStaffShift(rowIndex) {
  if (!isCurrentUserAdmin()) {
    throw new Error("Only admins can delete staff shifts");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  
  const shiftsRange = sheet.getRange('H5:H');
  const shifts = shiftsRange.getValues();
  
  sheet.getRange(`H${rowIndex}`).clearContent();
  
  const lastRowWithData = shifts.filter(row => row[0] !== '').length + 4;
  
  if (rowIndex < lastRowWithData) {
    const rangeToCopy = sheet.getRange(`H${rowIndex+1}:H${lastRowWithData}`);
    const valuesToCopy = rangeToCopy.getValues();
    
    for (let i = 0; i < valuesToCopy.length; i++) {
      sheet.getRange(`H${rowIndex+i}`).setValue(valuesToCopy[i][0]);
    }
    
    sheet.getRange(`H${lastRowWithData}`).clearContent();
  }
  
  return { success: true, message: "Staff shift deleted successfully" };
}