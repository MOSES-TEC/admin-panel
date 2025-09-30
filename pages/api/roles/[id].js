import mongoose from 'mongoose';
import { Role } from '@/models/Role';
import { connectDB } from '@/lib/db';
import ModelSchema from '@/models/ModelSchema';
import { hasPermission, PERMISSIONS, updateRBACFromRole } from '@/lib/rbac';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const checkAuth = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return session;
};


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

  const session = await checkAuth(req, res);
  if (!session) return;

  const {
    query: { id },
    method,
  } = req;

  // Connect to database
  const conn = await connectDB();

  // If connection failed, return error
  if (!conn) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please check your environment variables.'
    });
  }

  switch (method) {
    case 'GET':
      try {

        if (!hasPermission(session.user.userRole, PERMISSIONS.READ)) {
          return res.status(403).json({ message: "Permission denied" });
        }

        const role = await Role.findById(id);

        if (!role) {
          return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.status(200).json({ success: true, data: role });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {

        if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
          return res.status(403).json({ message: "Permission denied" });
        }
        const role = await Role.findById(id);

        if (!role) {
          return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Extract and validate input data
        const { name, permissions, routes, description, isSystemRole } = req.body;

        if (!name || typeof name !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Role name is required and must be a string'
          });
        }

        // Convert name to lowercase and trim
        const sanitizedName = name.toLowerCase().trim();

        // Prevent modification of system roles name
        if (role.isSystemRole && sanitizedName !== role.name) {
          return res.status(403).json({
            success: false,
            message: 'Cannot change the name of system roles'
          });
        }

        // Check if new name is already taken by another role
        if (sanitizedName !== role.name) {
          const existingRole = await Role.findOne({ name: sanitizedName });
          if (existingRole) {
            return res.status(400).json({
              success: false,
              message: 'Role with this name already exists'
            });
          }
        }

        // Prepare data for role update
        const roleData = {
          name: sanitizedName,
          permissions: {
            create: permissions?.create ?? role.permissions.create,
            read: permissions?.read ?? role.permissions.read,
            update: permissions?.update ?? role.permissions.update,
            delete: permissions?.delete ?? role.permissions.delete
          },
          routes: Array.isArray(routes) ? routes : role.routes,
          description: description || role.description,
          isSystemRole: role.isSystemRole // Cannot change system role status
        };

        // Update the role
        const updatedRole = await Role.findByIdAndUpdate(id, roleData, {
          new: true,
          runValidators: true,
        });

        // Update User model schema if the role name has changed
        if (role.name !== updatedRole.name) {
          await updateUserModelEnumValues();

          // Additional direct regeneration for better reliability
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

              console.log('User model code directly regenerated after role update');
            }
          } catch (codegenError) {
            console.error('Error directly regenerating model code on update:', codegenError);
            // Continue anyway
          }
        }

        // Update RBAC in-memory configuration
        updateRBACFromRole(updatedRole);

        res.status(200).json({ success: true, data: updatedRole });
      } catch (error) {
        console.error('Error updating role:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to update role',
          error: error.toString()
        });
      }
      break;

    case 'DELETE':
      try {
        if (!hasPermission(session.user.userRole, PERMISSIONS.DELETE)) {
          return res.status(403).json({ message: "Permission denied" });
        }
        const role = await Role.findById(id);

        if (!role) {
          return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Prevent deletion of system roles
        if (role.isSystemRole) {
          return res.status(403).json({
            success: false,
            message: 'Cannot delete system roles'
          });
        }

        await Role.deleteOne({ _id: id });

        // Update User model schema after deleting the role
        await updateUserModelEnumValues();

        // Additional direct regeneration for better reliability after deletion
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

            console.log('User model code directly regenerated after role deletion');
          }
        } catch (codegenError) {
          console.error('Error directly regenerating model code on deletion:', codegenError);
          // Continue anyway
        }

        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        console.error('Error deleting role:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to delete role',
          error: error.toString()
        });
      }
      break;

    default:
      res.status(405).json({ success: false, message: 'Method not allowed' });
      break;
  }
} 