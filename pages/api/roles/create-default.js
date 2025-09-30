import { Role } from '@/models/Role';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, updateRBACFromRole, hasPermission } from '@/lib/rbac';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import ModelSchema from '@/models/ModelSchema';

// Update User model with new role
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    // Connect to database
    const conn = await connectDB();
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }

    // Get role name from request body
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const sanitizedName = name.trim().toLowerCase();

    // Check if role already exists
    const existingRole = await Role.findOne({ name: sanitizedName });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create role with demo-like permissions
    const roleData = {
      name: sanitizedName,
      permissions: {
        create: false,
        read: true,
        update: false,
        delete: false
      },
      routes: ['/manager', '/media', '/setting/overview', '/setting/profile', '/'],
      description: `${sanitizedName} role`,
      isSystemRole: false
    };

    // Create the role in the database
    const role = await Role.create(roleData);

    // Must explicitly update the User model schema with the new role AFTER creation
    await updateUserModelEnumValues();
    
    // Update RBAC in-memory configuration
    updateRBACFromRole(role);

    // Also trigger the direct code regeneration endpoint for User model
    try {
      // Get the User model for regeneration
      const userModel = await ModelSchema.findOne({ name: 'user' });
      if (userModel) {
        // Import necessary modules for direct code generation
        const { generateModelCode } = require('@/lib/modelGenerator');
        const fs = require('fs');
        const path = require('path');
        
        // Generate the model code
        const modelCode = generateModelCode(userModel);
        
        // Write it directly to the User.js file
        const modelPath = path.join(process.cwd(), 'models', 'User.js');
        fs.writeFileSync(modelPath, modelCode);
        
        console.log('User model code directly regenerated after role creation');
      }
    } catch (codegenError) {
      console.error('Error directly regenerating model code:', codegenError);
      // Continue anyway, the updateUserModelEnumValues should have handled it
    }

    // Now force a server restart to ensure changes take effect
    try {
      // This is a lightweight way to signal the app needs restart
      const fs = require('fs');
      const path = require('path');
      const touchFile = path.join(process.cwd(), '.needs-restart');
      fs.writeFileSync(touchFile, new Date().toString());
    } catch (restartError) {
      console.warn('Could not signal for restart:', restartError);
      // Continue anyway, not critical
    }

    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create role'
    });
  }
} 