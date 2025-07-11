
function doGet() {
  return HtmlService.createTemplateFromFile('RoosterApp')
    .evaluate()
    .setTitle('Roster Management')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


function getInitialData() {
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  
  const settingsSheet = ss.getSheetByName('Settings');
  const rosterSheet = ss.getSheetByName('Rosters');
  
  const result = {
    userAccess: getCurrentUserAccess(),
    rosters: [],
    users: [],
    statuses: [],
    rosterTypesWithColors: []
  };
  
  
  if (rosterSheet && rosterSheet.getLastRow() >= 4) {
    const rosterData = rosterSheet.getRange(4, 2, Math.max(1, rosterSheet.getLastRow() - 3), 3).getValues();
    result.rosters = rosterData.filter(row => row[0]).map(row => {
      let monthYear = row[1];
      
      
      if (typeof monthYear === 'object' && monthYear instanceof Date) {
        monthYear = Utilities.formatDate(monthYear, Session.getScriptTimeZone(), 'MMMM yyyy');
      } else if (typeof monthYear === 'string' && monthYear.includes('-')) {
        const date = new Date(monthYear);
        monthYear = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM yyyy');
      }
      
      return {
        id: row[0],
        monthYear: monthYear,
        type: row[2]
      };
    });
  }
  
  
  if (settingsSheet && settingsSheet.getLastRow() >= 5) {
    const lastRow = settingsSheet.getLastRow();
    
    const settingsData = settingsSheet.getRange(5, 2, lastRow - 4, 10).getValues(); 
    
    settingsData.forEach(row => {
      
      if (row[0]) result.users.push(row[0]);
      
      
      if (row[6]) result.statuses.push(row[6]);
      
      
      if (row[8]) {
        result.rosterTypesWithColors.push({
          type: row[8],
          color: row[9] || '#4285f4'
        });
      }
    });
  }
  
  return result;
}


function getCurrentUserAccess() {
  const userEmail = Session.getActiveUser().getEmail().toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  
  if (!settingsSheet || settingsSheet.getLastRow() < 5) {
    return { email: userEmail, accessLevel: 'none' };
  }
  
  
  const emailData = settingsSheet.getRange(5, 3, settingsSheet.getLastRow() - 4, 3).getValues(); 
  
  
  for (let i = 0; i < emailData.length; i++) {
    if (emailData[i][2] && emailData[i][2].toString().toLowerCase() === userEmail) {
      return { email: userEmail, accessLevel: 'admin' };
    }
  }
  
  
  for (let i = 0; i < emailData.length; i++) {
    if (emailData[i][0] && emailData[i][0].toString().toLowerCase() === userEmail) {
      return { email: userEmail, accessLevel: 'view' };
    }
  }
  
  return { email: userEmail, accessLevel: 'none' };
}


function getAllRosters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rosterSheet = ss.getSheetByName('Rosters');
  
  if (!rosterSheet || rosterSheet.getLastRow() < 4) {
    return [];
  }

  const dataRange = rosterSheet.getRange(4, 2, Math.max(1, rosterSheet.getLastRow() - 3), 3);
  const data = dataRange.getValues();
  const rosters = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i][0]) {
      let monthYear = data[i][1];
      
      if (typeof monthYear === 'object' && monthYear instanceof Date) {
        monthYear = Utilities.formatDate(monthYear, Session.getScriptTimeZone(), 'MMMM yyyy');
      } else if (typeof monthYear === 'string' && monthYear.includes('-')) {
        const date = new Date(monthYear);
        monthYear = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM yyyy');
      }
      
      rosters.push({
        id: data[i][0],
        monthYear: monthYear,
        type: data[i][2]
      });
    }
  }
  
  return rosters;
}

function checkRosterTypeExists(monthYear, rosterType, excludeId = null) {
  const rosters = getAllRosters();
  
  return rosters.some(roster => 
    roster.monthYear === monthYear && 
    roster.type === rosterType && 
    roster.id !== excludeId
  );
}

function getRosterTypesWithColors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  
  if (!settingsSheet || settingsSheet.getLastRow() < 5) {
    return [];
  }
  
  const typesRange = settingsSheet.getRange('J5:K' + settingsSheet.getLastRow()).getValues();
  const result = [];
  
  for (let i = 0; i < typesRange.length; i++) {
    if (typesRange[i][0]) {
      result.push({
        type: typesRange[i][0],
        color: typesRange[i][1] || '#4285f4'
      });
    }
  }
  
  return result;
}

function getRosterTypes() {
  const typesWithColors = getRosterTypesWithColors();
  return typesWithColors.map(item => item.type);
}

function getUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  
  if (!settingsSheet || settingsSheet.getLastRow() < 5) {
    return [];
  }
  
  const users = settingsSheet.getRange('B5:B' + settingsSheet.getLastRow()).getValues();
  const result = users.filter(row => row[0] !== '').map(row => row[0]);
  
  return result;
}

function getStaffStatuses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  
  if (!settingsSheet || settingsSheet.getLastRow() < 5) {
    return [];
  }
  
  const statuses = settingsSheet.getRange('H5:H' + settingsSheet.getLastRow()).getValues();
  const result = statuses.filter(row => row[0] !== '').map(row => row[0]);
  
  return result;
}

function generateRosterId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rosterSheet = ss.getSheetByName('Rosters');
  
  if (!rosterSheet) {
    const newSheet = ss.insertSheet('Rosters');
    return 'RID' + Math.floor(1000000 + Math.random() * 9000000).toString();
  }
  
  let existingIds = new Set();
  if (rosterSheet.getLastRow() >= 4) {
    const ids = rosterSheet.getRange(4, 2, rosterSheet.getLastRow() - 3, 1).getValues();
    ids.forEach(row => {
      if (row[0]) existingIds.add(row[0]);
    });
  }
  
  let newId;
  do {
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
    newId = 'RID' + randomDigits;
  } while (existingIds.has(newId));
  
  return newId;
}

function createRoster(monthYear, rosterType) {
  const userAccess = getCurrentUserAccess();
  if (userAccess.accessLevel !== 'admin') {
    throw new Error('Access denied. Only administrators can create rosters.');
  }
  
  if (checkRosterTypeExists(monthYear, rosterType)) {
    throw new Error(`A roster of type "${rosterType}" already exists for ${monthYear}. Each month can only have one roster of each type.`);
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let rosterSheet = ss.getSheetByName('Rosters');
  
  if (!rosterSheet) {
    rosterSheet = ss.insertSheet('Rosters');
    rosterSheet.getRange(3, 2).setValue("Roster ID");
    rosterSheet.getRange(3, 3).setValue("Month/Year");
    rosterSheet.getRange(3, 4).setValue("Roster Type");
  }
  
  const rosterId = generateRosterId();
  let nextRow = 4;
  while (nextRow <= rosterSheet.getLastRow() && rosterSheet.getRange(nextRow, 2).getValue() !== '') {
    nextRow++;
  }
  
  rosterSheet.getRange(nextRow, 2).setValue(rosterId);
  rosterSheet.getRange(nextRow, 3).setValue(monthYear);
  rosterSheet.getRange(nextRow, 4).setValue(rosterType);
  
  return {
    id: rosterId,
    monthYear: monthYear,
    type: rosterType
  };
}

function getUsersForRoster(rosterId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersRosterSheet = ss.getSheetByName('Users Rosters');
  
  if (!usersRosterSheet || usersRosterSheet.getLastRow() < 4) {
    return [];
  }
  
  const dataRange = usersRosterSheet.getRange(4, 2, Math.max(1, usersRosterSheet.getLastRow() - 3), 3);
  const data = dataRange.getValues();
  const users = [];
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === rosterId) {
      let dayStatuses = [];
      try {
        dayStatuses = data[i][2] ? JSON.parse(data[i][2]) : [];
      } catch (e) {
        dayStatuses = [];
      }
      
      users.push({
        rosterId: data[i][0],
        username: data[i][1],
        dayStatuses: dayStatuses,
        rowIndex: i + 4
      });
    }
  }
  
  return users;
}

function addUsersToRoster(rosterId, usernames) {
  const userAccess = getCurrentUserAccess();
  if (userAccess.accessLevel !== 'admin') {
    throw new Error('Access denied. Only administrators can add users to rosters.');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let usersRosterSheet = ss.getSheetByName('Users Rosters');
  
  if (!usersRosterSheet) {
    usersRosterSheet = ss.insertSheet('Users Rosters');
    usersRosterSheet.getRange(3, 2).setValue("Roster ID");
    usersRosterSheet.getRange(3, 3).setValue("Username");
    usersRosterSheet.getRange(3, 4).setValue("Day Statuses (JSON)");
  }
  
  const existingUsers = new Set();
  if (usersRosterSheet.getLastRow() >= 4) {
    const existingData = usersRosterSheet.getRange(4, 2, usersRosterSheet.getLastRow() - 3, 2).getValues();
    existingData.forEach(row => {
      if (row[0] === rosterId) {
        existingUsers.add(row[1]);
      }
    });
  }
  
  const newUsers = usernames.filter(username => !existingUsers.has(username));
  
  if (newUsers.length === 0) {
    throw new Error('All selected users already exist in this roster');
  }
  
  let nextRow = 4;
  while (nextRow <= usersRosterSheet.getLastRow() && usersRosterSheet.getRange(nextRow, 2).getValue() !== '') {
    nextRow++;
  }
  
  const emptyDayStatuses = JSON.stringify([]);
  const batchData = newUsers.map(username => [rosterId, username, emptyDayStatuses]);
  
  if (batchData.length > 0) {
    const range = usersRosterSheet.getRange(nextRow, 2, batchData.length, 3);
    range.setValues(batchData);
  }
  
  return newUsers.map((username, index) => ({
    rosterId: rosterId,
    username: username,
    dayStatuses: [],
    rowIndex: nextRow + index
  }));
}

function batchUpdateUserStatuses(updates) {
  const userAccess = getCurrentUserAccess();
  if (userAccess.accessLevel !== 'admin') {
    throw new Error('Access denied. Only administrators can update user statuses.');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersRosterSheet = ss.getSheetByName('Users Rosters');
  
  if (!usersRosterSheet || usersRosterSheet.getLastRow() < 4 || !updates || updates.length === 0) {
    return 0;
  }
  
  const dataRange = usersRosterSheet.getRange(4, 2, usersRosterSheet.getLastRow() - 3, 2);
  const data = dataRange.getValues();
  
  const rowMap = new Map();
  for (let i = 0; i < data.length; i++) {
    const key = `${data[i][0]}_${data[i][1]}`;
    rowMap.set(key, i + 4);
  }
  
  const batchData = [];
  const ranges = [];
  
  updates.forEach(update => {
    const key = `${update.rosterId}_${update.username}`;
    const rowIndex = rowMap.get(key);
    
    if (rowIndex) {
      ranges.push(usersRosterSheet.getRange(rowIndex, 4));
      batchData.push([JSON.stringify(update.dayStatuses)]);
    }
  });
  
  if (ranges.length > 0) {
    ranges.forEach((range, index) => {
      range.setValue(batchData[index][0]);
    });
  }
  
  return ranges.length;
}

function updateUserDayStatuses(rosterId, username, dayStatuses) {
  return batchUpdateUserStatuses([{
    rosterId: rosterId,
    username: username,
    dayStatuses: dayStatuses
  }]) > 0;
}

function removeUserFromRoster(rosterId, username) {
  const userAccess = getCurrentUserAccess();
  if (userAccess.accessLevel !== 'admin') {
    throw new Error('Access denied. Only administrators can remove users from rosters.');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersRosterSheet = ss.getSheetByName('Users Rosters');
  
  if (!usersRosterSheet || usersRosterSheet.getLastRow() < 4) {
    throw new Error('Users Rosters sheet not found or empty');
  }
  
  const dataRange = usersRosterSheet.getRange(4, 2, usersRosterSheet.getLastRow() - 3, 2);
  const data = dataRange.getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === rosterId && data[i][1] === username) {
      usersRosterSheet.deleteRow(4 + i);
      return true;
    }
  }
  
  throw new Error('User not found in roster');
}

function getMonthDetails(monthYear) {
  if (!monthYear) {
    return { daysInMonth: 31, dayDetails: [] };
  }
  
  const [month, year] = monthYear.split(' ');
  const monthIndex = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].indexOf(month);
  
  if (monthIndex === -1 || !year) {
    return { daysInMonth: 31, dayDetails: [] };
  }
  
  const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();
  const dayDetails = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(parseInt(year), monthIndex, day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    dayDetails.push({
      day: day,
      dayName: dayName,
      date: `${day}/${monthIndex + 1}`
    });
  }
  
  return { daysInMonth, dayDetails };
}

function getAvailableRosterTypesForMonth(monthYear) {
  const allTypes = getRosterTypes();
  const existingRosters = getAllRosters();
  
  const usedTypes = existingRosters
    .filter(roster => roster.monthYear === monthYear)
    .map(roster => roster.type);
  
  return allTypes.filter(type => !usedTypes.includes(type));
}