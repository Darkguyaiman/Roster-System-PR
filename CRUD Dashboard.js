function doGet() {
  return HtmlService.createHtmlOutputFromFile('CRUDDashboard')
    .setTitle('Dashboard Tab')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = {
      rawDashboard: ss.getSheetByName('Raw dashboard'),
      rosters: ss.getSheetByName('Rosters'),
      usersRosters: ss.getSheetByName('Users Rosters'),
      settings: ss.getSheetByName('Settings')
    };
    
    if (!sheets.rawDashboard) throw new Error('Raw dashboard sheet not found');
    
    const dashboardCounts = sheets.rawDashboard.getRange('C3:C4').getValues();
    
    const [recentRosters, userStats] = [
      sheets.rosters ? getRecentRostersOptimized(sheets.rosters) : [],
      (sheets.settings && sheets.usersRosters) ? getUserStatsOptimized(sheets.settings, sheets.usersRosters) : []
    ];
    
    return {
      thisMonthCount: dashboardCounts[0][0] || 0,
      totalAssignedCount: dashboardCounts[1][0] || 0,
      recentRosters,
      userStats
    };
    
  } catch (error) {
    console.error('getDashboardData error:', error);
    throw new Error('Failed to load dashboard: ' + error.message);
  }
}

function getRecentRostersOptimized(rostersSheet) {
  const lastRow = rostersSheet.getLastRow();
  if (lastRow < 4) return [];
  
  const numRows = Math.min(10, lastRow - 3);
  const data = rostersSheet.getRange(4, 3, numRows, 2).getValues();
  
  return data
    .filter(([date, type]) => date && type)
    .map(([date, type]) => ({
      type: type.toString(),
      month: new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }))
    .slice(0, 10);
}

function getUserStatsOptimized(settingsSheet, usersRostersSheet) {
  const settingsLastRow = settingsSheet.getLastRow();
  const rostersLastRow = usersRostersSheet.getLastRow();
  
  if (settingsLastRow < 5 || rostersLastRow < 4) return [];
  
  const [usersB, usersD] = [
    settingsSheet.getRange(5, 2, settingsLastRow - 4, 1).getValues().flat(),
    settingsSheet.getRange(5, 4, settingsLastRow - 4, 1).getValues().flat()
  ];
  
  const uniqueUsers = [...new Set([...usersB, ...usersD]
    .filter(user => user && user.toString().trim())
    .map(user => user.toString().trim()))];
  
  if (!uniqueUsers.length) return [];
  
  const assignments = usersRostersSheet.getRange(4, 3, rostersLastRow - 3, 1)
    .getValues()
    .flat()
    .filter(user => user && user.toString().trim())
    .map(user => user.toString().trim());
  
  const assignmentCounts = assignments.reduce((acc, user) => {
    acc[user] = (acc[user] || 0) + 1;
    return acc;
  }, {});
  
  return uniqueUsers
    .map(user => ({ name: user, count: assignmentCounts[user] || 0 }))
    .sort((a, b) => b.count - a.count);
}

function getThisMonthRosters() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rostersSheet = ss.getSheetByName('Rosters');
    const usersRostersSheet = ss.getSheetByName('Users Rosters');
    
    if (!rostersSheet || !usersRostersSheet) throw new Error('Required sheets not found');
    
    const currentDate = new Date();
    const targetMonth = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    
    const rosterValues = rostersSheet.getDataRange().getValues();
    const userValues = usersRostersSheet.getDataRange().getValues();
    
    if (rosterValues.length < 4) return [];
    
    const thisMonthRosters = new Map();
    
    for (let i = 3; i < rosterValues.length; i++) {
      const [ , id, date, type ] = rosterValues[i];
      if (!id || !date) continue;

      const monthTag = `${new Date(date).getFullYear()}-${new Date(date).getMonth()}`;
      if (monthTag === targetMonth) {
        const idStr = id.toString();
        thisMonthRosters.set(idStr, {
          id: idStr,
          type: type ? type.toString() : '',
          users: []
        });
      }
    }

    if (thisMonthRosters.size === 0) return [];

    for (let i = 3; i < userValues.length; i++) {
      const [ , rosterId, user ] = userValues[i];
      if (!rosterId || !user) continue;

      const idStr = rosterId.toString();
      const trimmedUser = user.toString().trim();
      if (thisMonthRosters.has(idStr)) {
        thisMonthRosters.get(idStr).users.push(trimmedUser);
      }
    }

    return Array.from(thisMonthRosters.values());

  } catch (error) {
    console.error('getThisMonthRosters error:', error);
    throw new Error("Failed to load this month's rosters: " + error.message);
  }
}
