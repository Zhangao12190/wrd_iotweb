// Access-scope helpers. The platform has three roles:
//   admin  -> sees every device, user and dealer (platform operator / WRD staff)
//   dealer -> sees devices it has sold and the end-users under it; can break data
//             down by destination country
//   user   -> sees only the devices it owns
//
// These helpers produce a SQL WHERE fragment + params so the same rules apply
// everywhere (lists, stats, telemetry, websocket filtering).

export function deviceScope(user) {
  switch (user.role) {
    case 'admin':
      return { where: '1=1', params: [] };
    case 'dealer':
      return { where: 'devices.dealer_id = ?', params: [user.id] };
    case 'user':
      return { where: 'devices.owner_user_id = ?', params: [user.id] };
    default:
      return { where: '1=0', params: [] };
  }
}

// Whether a user may see a specific device row.
export function canAccessDevice(user, device) {
  if (!device) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'dealer') return device.dealer_id === user.id;
  if (user.role === 'user') return device.owner_user_id === user.id;
  return false;
}

// Capabilities exposed to the frontend so it can build role-aware menus.
export function capabilities(user) {
  const base = {
    viewDevices: true,
    viewTelemetry: true,
    viewDashboard: true
  };
  if (user.role === 'admin') {
    return {
      ...base,
      manageUsers: true,
      manageDealers: true,
      manageDevices: true,
      viewCountryBreakdown: true,
      viewAllDealers: true
    };
  }
  if (user.role === 'dealer') {
    return {
      ...base,
      manageDevices: true,
      manageUsers: true, // dealer manages its own end-users
      viewCountryBreakdown: true
    };
  }
  return base; // plain user
}
