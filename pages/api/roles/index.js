import { Role } from '@/models/Role';
import { ROLES, PERMISSIONS, ROUTE_ACCESS, ROLE_PERMISSIONS, hasPermission } from '@/lib/rbac';
import { dbConnect } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import ModelSchema from '@/models/ModelSchema';

// Initialize default roles if they don't exist
async function ensureDefaultRoles() {
  try {
    const count = await Role.countDocuments();

    // Only seed if no roles exist
    if (count === 0) {
      const defaultRoles = Object.keys(ROLES).map(roleKey => {
        const roleName = ROLES[roleKey].toLowerCase();
        const roleConfig = ROLE_PERMISSIONS[ROLES[roleKey]];

        return {
          name: roleName,
          permissions: {
            create: roleConfig[PERMISSIONS.CREATE] || false,
            read: roleConfig[PERMISSIONS.READ] || false,
            update: roleConfig[PERMISSIONS.UPDATE] || false,
            delete: roleConfig[PERMISSIONS.DELETE] || false
          },
          routes: roleConfig.routes.includes('*') ?
            Object.keys(ROUTE_ACCESS) :
            roleConfig.routes,
          isSystemRole: true,
          description: `Default ${roleName} role`
        };
      });

      await Role.insertMany(defaultRoles);
      console.log('Default roles created');
    }
  } catch (error) {
    console.error('Error ensuring default roles:', error);
  }
}

// Update User model's userRole enum values
async function updateUserModelEnumValues() {
  try {
    // Get all roles - make sure to get FRESH data after the create/update/delete operation
    const roles = await Role.find({}, 'name').sort({ createdAt: 1 });
    const roleNames = roles.map(role => role.name.toLowerCase());

    console.log('Updating User model with roles:', roleNames);

    // Get User model schema - findOneAndUpdate to ensure we get the latest version
    const userModel = await ModelSchema.findOne({ name: 'user' });
    if (!userModel) {
      console.warn('User model not found in ModelSchema');
      return false;
    }

    // Find the userRole field
    const userRoleField = userModel.fields.find(field => field.name === 'userRole');
    if (!userRoleField) {
      console.warn('userRole field not found in User model');
      return false;
    }

    // Update enum values - make deep copy to ensure changes are detected
    userRoleField.enumValues = [...roleNames];
    userModel.markModified('fields'); // Explicitly mark fields as modified

    // Force update with this method
    await ModelSchema.updateOne(
      { _id: userModel._id },
      { $set: { fields: userModel.fields } }
    );
    
    // ALSO save the model to be double sure
    const savedModel = await userModel.save({ validateBeforeSave: true });
    
    // Verify the update worked
    const verifyModel = await ModelSchema.findOne({ name: 'user' });
    const verifyField = verifyModel.fields.find(field => field.name === 'userRole');
    console.log('Verification - User model enum values now:', verifyField.enumValues);
    
    // Server-side direct model regeneration
    try {
      // Import the model generator (in the same process)
      const { generateModelCode } = require('@/lib/modelGenerator');
      const fs = require('fs');
      const path = require('path');
      
      // Generate the model code
      const modelCode = generateModelCode(userModel);
      
      // First check if User.js exists
      const modelPath = path.join(process.cwd(), 'models', 'User.js');
      
      // Write directly to the file system
      fs.writeFileSync(modelPath, modelCode);
      
      console.log('User model code regenerated directly');

      // Now force a server restart to ensure changes take effect
      try {
        // This is a lightweight way to signal the app needs restart
        const touchFile = path.join(process.cwd(), '.needs-restart');
        fs.writeFileSync(touchFile, new Date().toString());
      } catch (restartError) {
        console.warn('Could not signal for restart:', restartError);
        // Continue anyway, not critical
      }
    } catch (regenerateError) {
      console.error('Error regenerating model code directly:', regenerateError);
      // Continue even if direct regeneration fails
    }

    console.log('User model schema updated with role names:', roleNames);
    return true;
  } catch (error) {
    console.error('Error updating User model schema:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // Connect to database
  const conn = await dbConnect();

  // If connection failed, return error
  if (!conn) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please check your environment variables.'
    });
  }

  // Ensure default roles exist
  await ensureDefaultRoles();

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const roles = await Role.find({});
        res.status(200).json({ success: true, data: roles });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        // Check auth for POST requests only
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
          return res.status(403).json({ success: false, message: "Permission denied" });
        }
        
        // Check if role already exists
        const { name } = req.body;
        const existingRole = await Role.findOne({ name });

        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: 'Role with this name already exists'
          });
        }

        const role = await Role.create(req.body);
        
        // Update User model with new role
        await updateUserModelEnumValues();
        
        // Update RBAC configuration
        await updateRBACFromRole(role);
        
        res.status(201).json({ success: true, data: role });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(405).json({ success: false, message: 'Method not allowed' });
      break;
  }
} 