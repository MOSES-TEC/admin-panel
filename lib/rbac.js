// Role-based access control utility

// Default roles for fallback - these will be dynamically replaced
export const ROLES = {
  SUPERADMIN: 'superadmin',
  CONTENTMANAGER: 'contentmanager',
  DEMO: 'demo'
};

// Default permissions
export const PERMISSIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
};

// Initially empty - will be populated dynamically
export const ROUTE_ACCESS = {};

// Initially empty - will be populated dynamically
export const ROLE_PERMISSIONS = {};

// Store all detected routes
export const ALL_ROUTES = new Set();

// Initialize the RBAC system
export const initializeRBAC = async () => {
  try {
    // First try to get roles from database
    const roles = await loadRolesFromDB();

    // If no roles found, use default roles
    if (!roles || roles.length === 0) {
      console.warn('No roles found in database, using default roles');
      setupDefaultRoles();
    } else {
      // Update RBAC with database roles
      roles.forEach(role => {
        updateRBACFromRole(role);
      });
    }

    // Detect routes if we're in the browser
    if (typeof window !== 'undefined') {
      await detectRoutes();
    }

    return true;
  } catch (error) {
    console.error('Error initializing RBAC:', error);
    setupDefaultRoles();
    return false;
  }
};

// Setup default roles and permissions (fallback)
const setupDefaultRoles = () => {
  // Clear existing data
  Object.keys(ROLE_PERMISSIONS).forEach(key => {
    delete ROLE_PERMISSIONS[key];
  });

  // Default route access
  const defaultRoutes = {
    '/builder': [ROLES.SUPERADMIN, ROLES.DEMO],
    '/setting/apitokens': [ROLES.SUPERADMIN, ROLES.CONTENTMANAGER, ROLES.DEMO],
    '/setting/envdata': [ROLES.SUPERADMIN],
    '/setting/profile': [ROLES.SUPERADMIN, ROLES.CONTENTMANAGER, ROLES.DEMO],
    '/setting/overview': [ROLES.SUPERADMIN, ROLES.CONTENTMANAGER, ROLES.DEMO],
    '/setting/permision': [ROLES.SUPERADMIN],
    '/setting': [ROLES.SUPERADMIN, ROLES.DEMO],
    '/': [ROLES.SUPERADMIN, ROLES.CONTENTMANAGER, ROLES.DEMO],
    '/manager': [ROLES.SUPERADMIN, ROLES.CONTENTMANAGER, ROLES.DEMO],
    '/media': [ROLES.SUPERADMIN, ROLES.CONTENTMANAGER, ROLES.DEMO],
    '/builder/[model]': [ROLES.SUPERADMIN],
  };

  // Add routes to ROUTE_ACCESS and ALL_ROUTES
  Object.keys(defaultRoutes).forEach(route => {
    ROUTE_ACCESS[route] = [...defaultRoutes[route]];
    ALL_ROUTES.add(route);
  });

  // Set up default permissions
  ROLE_PERMISSIONS[ROLES.SUPERADMIN] = {
    [PERMISSIONS.CREATE]: true,
    [PERMISSIONS.READ]: true,
    [PERMISSIONS.UPDATE]: true,
    [PERMISSIONS.DELETE]: true,
    routes: ['*'] // Access to all routes
  };

  ROLE_PERMISSIONS[ROLES.CONTENTMANAGER] = {
    [PERMISSIONS.CREATE]: true,
    [PERMISSIONS.READ]: true,
    [PERMISSIONS.UPDATE]: true,
    [PERMISSIONS.DELETE]: true,
    routes: ['/manager', '/media', '/setting/overview', '/setting/apitokens', '/setting/profile', '/']
  };

  ROLE_PERMISSIONS[ROLES.DEMO] = {
    [PERMISSIONS.CREATE]: false,
    [PERMISSIONS.READ]: true,
    [PERMISSIONS.UPDATE]: false,
    [PERMISSIONS.DELETE]: false,
    routes: ['/manager', '/media', '/setting/overview', '/setting/profile', '/setting/apitokens', '/builder']
  };
};

// Load roles from database
const loadRolesFromDB = async () => {
  try {
    if (typeof window === 'undefined') {
      // Server-side code
      try {
        // Dynamic import to avoid circular dependencies
        const mongoose = await import('mongoose');
        const { Role } = await import('../models/Role');

        // Connect to database if not already connected
        if (!mongoose.connection.readyState) {
          const MONGODB_URI = process.env.MONGODB_URI;
          if (!MONGODB_URI) {
            return null;
          }

          await mongoose.connect(MONGODB_URI, {
            bufferCommands: false
          });
        }

        return await Role.find({});
      } catch (error) {
        console.error('Server-side DB connection error:', error);
        return null;
      }
    } else {
      // Client-side code
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');

      const data = await response.json();
      return data.success ? data.data : [];
    }
  } catch (error) {
    console.error('Error in loading roles from DB:', error);
    return null;
  }
};

// Dynamically detect routes in the app
export const detectRoutes = async () => {
  try {
    // Try to get routes from Next.js router (client side)
    if (typeof window !== 'undefined') {
      // Find all elements with href attributes that start with /
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('#') && !href.includes('?')) {
          ALL_ROUTES.add(href);

          // If not already in ROUTE_ACCESS, add with superadmin access
          if (!ROUTE_ACCESS[href]) {
            ROUTE_ACCESS[href] = [ROLES.SUPERADMIN];
          }
        }
      });
    }

    return Array.from(ALL_ROUTES);
  } catch (error) {
    console.error('Error in detecting routes:', error);
    return Array.from(ALL_ROUTES);
  }
};

// Get all available roles from the app
export const getAllRoles = async () => {
  try {
    const response = await fetch('/api/roles');
    if (!response.ok) throw new Error('Failed to fetch roles');

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error in fetching roles:', error);
    // Return static roles as fallback
    return Object.keys(ROLES).map(key => ({
      name: ROLES[key],
      permissions: ROLE_PERMISSIONS[ROLES[key]],
      isSystemRole: true
    }));
  }
};

// Update the ROLE_PERMISSIONS and ROUTE_ACCESS with data from a role
export const updateRBACFromRole = (role) => {
  if (!role || !role.name) return false;

  // The role name in lowercase
  const roleName = role.name.toLowerCase();

  // Update the ROLES object if it doesn't exist
  let roleKey = null;
  Object.keys(ROLES).forEach(key => {
    if (ROLES[key].toLowerCase() === roleName) {
      roleKey = ROLES[key];
    }
  });

  // If role doesn't exist in ROLES, add it
  if (!roleKey) {
    roleKey = roleName;
    ROLES[roleName.toUpperCase().replace(/\s+/g, '_')] = roleName;
  }

  // Update the permissions for this role in ROLE_PERMISSIONS
  ROLE_PERMISSIONS[roleKey] = {
    [PERMISSIONS.CREATE]: role.permissions?.create || false,
    [PERMISSIONS.READ]: role.permissions?.read || true,
    [PERMISSIONS.UPDATE]: role.permissions?.update || false,
    [PERMISSIONS.DELETE]: role.permissions?.delete || false,
    routes: role.routes || []
  };

  // Update ROUTE_ACCESS to match the role's routes
  // First, remove this role from all routes
  Object.keys(ROUTE_ACCESS).forEach(route => {
    ROUTE_ACCESS[route] = ROUTE_ACCESS[route].filter(r => r !== roleKey);
  });

  // Then, add the role to its permitted routes
  if (role.routes.includes('*')) {
    // If wildcard access, add to all routes
    Object.keys(ROUTE_ACCESS).forEach(route => {
      if (!ROUTE_ACCESS[route].includes(roleKey)) {
        ROUTE_ACCESS[route].push(roleKey);
      }
    });
  } else {
    // Add to specific routes
    role.routes.forEach(route => {
      // Make sure the route is in ALL_ROUTES
      ALL_ROUTES.add(route);

      if (ROUTE_ACCESS[route]) {
        if (!ROUTE_ACCESS[route].includes(roleKey)) {
          ROUTE_ACCESS[route].push(roleKey);
        }
      } else {
        // Create new route entry if it doesn't exist
        ROUTE_ACCESS[route] = [roleKey];
      }
    });
  }

  return true;
};

// Sync all RBAC data from database
export const syncRBAC = async () => {
  try {
    // First, detect any new routes
    await detectRoutes();

    // Fetch roles from the API
    const roles = await loadRolesFromDB();
    if (!roles || roles.length === 0) {
      throw new Error('No roles found in database');
    }

    // Update each role in the RBAC config
    let updatedCount = 0;

    roles.forEach(role => {
      if (updateRBACFromRole(role)) {
        updatedCount++;
      }
    });

    console.log(`RBAC configuration updated with ${updatedCount} roles from database`);
    return true;
  } catch (error) {
    console.error('Error syncing RBAC with database:', error);
    return false;
  }
};

// Get roles for client-side use without making an API call
// Useful for sign-in/sign-up pages that don't need actual role objects
export const getLocalRoles = () => {
  return Object.values(ROLES).map(roleName => ({
    name: roleName.toLowerCase(),
    isSuperAdmin: roleName.toLowerCase() === 'superadmin',
    isSystemRole: true
  }));
};

// Check if a user has permission for a specific action
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;

  /*if(!userRole || !ROLE_PERMISSIONS[userRole]) return false;

  // Special handling for DEMO users
  if(userRole === ROLES.DEMO) {
    // DEMO users can only read, no other permissions
    return permission === PERMISSIONS.READ;
  }

  return ROLE_PERMISSIONS[userRole][permission] || false; */

  // Normalize role name to lowercase
  const normalizedRole = userRole.toLowerCase();

  // Superadmin has all permissions
  if (normalizedRole === ROLES.SUPERADMIN.toLowerCase()) {
    return true;
  }

  // DEMO users can only read
  if (normalizedRole === ROLES.DEMO.toLowerCase()) {
    return permission === PERMISSIONS.READ;
  }

  // Check role permissions
  const rolePermissions = ROLE_PERMISSIONS[normalizedRole] || {};
  return rolePermissions[permission] || false;
};

// Check if a user has access to a specific route
export const hasRouteAccess = (userRole, path) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) return false;

  // Superadmin has access to everything
  if (userRole === ROLES.SUPERADMIN) return true;

  // Check if the route is explicitly restricted
  if (ROUTE_ACCESS[path] && !ROUTE_ACCESS[path].includes(userRole)) {
    return false;
  }

  // Check if the user's role has access to the route pattern
  return ROLE_PERMISSIONS[userRole].routes.some(routePattern => {
    if (routePattern === '*') return true;
    const pattern = new RegExp('^' + routePattern.replace('*', '.*') + '$');
    return pattern.test(path);
  });
};

// Middleware to check route access
export const checkRouteAccess = (req, res, next) => {
  const session = req.session;
  if (!session || !session.user || !session.user.userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const path = req.path;
  if (!hasRouteAccess(session.user.userRole, path)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};

// Initialize RBAC on module load if we're in the browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeRBAC, 1);
  } else {
    document.addEventListener('DOMContentLoaded', initializeRBAC);
  }
} else {
  // For server-side, initialize on first import
  initializeRBAC();
}






