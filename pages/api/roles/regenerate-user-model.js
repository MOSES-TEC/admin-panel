import ModelSchema from '@/models/ModelSchema';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { Role } from '@/models/Role';
import fs from 'fs';
import path from 'path';
import { generateModelCode } from '@/template/ModelCompo';
import { generateApiCode } from '@/template/ApiCompo';
import { generateApiWithTokenSupport } from '@/template/externalApiCompo';
import { generatePageCode } from '@/template/PageCompo';
import { generateComponentCode } from '@/template/ComponentCompo';
import { generateCreateFormCode } from '@/template/CreatePage';
import { generateEditFormCode } from '@/template/EditPage';

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

    // Check permission - only admin users should be able to regenerate models
    if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
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

    // Find the User model schema
    const userModel = await ModelSchema.findOne({ name: 'user' });
    if (!userModel) {
      return res.status(404).json({
        success: false,
        message: 'User model not found'
      });
    }

    // Refresh the role enumValues to ensure they're up to date
    try {
      // Get all roles
      const roles = await Role.find({}, 'name').sort({ createdAt: 1 });
      const roleNames = roles.map(role => role.name.toLowerCase());

      // Find the userRole field
      const userRoleField = userModel.fields.find(field => field.name === 'userRole');
      if (userRoleField) {
        // Update enum values
        userRoleField.enumValues = [...roleNames];
        userModel.markModified('fields');
        
        // Save the updated enum values
        await ModelSchema.updateOne(
          { _id: userModel._id },
          { $set: { fields: userModel.fields } }
        );
        
        // Also save to be sure
        await userModel.save({ validateBeforeSave: true });
        
        console.log('Updated User model enum values with roles:', roleNames);
      }
    } catch (roleError) {
      console.error('Error updating role enum values:', roleError);
      // Continue with regeneration anyway
    }

    // Generate and save all User model related files
    try {
      const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
      const modelName = userModel.name.toLowerCase();
      const ModelName = capitalizeFirstLetter(modelName);
      const fields = userModel.fields;
      
      // Format fields for model generation
      const formatFields = (fields) => {
        return fields
          .map((field) => {
            let typeDefinition = `{ type: ${capitalizeType(field.type)} }`;
            
            // Start building type properties
            const typeProps = [`type: ${capitalizeType(field.type)}`];
            
            if (field.required) {
              typeProps.push('required: true');
            }
            
            if (field.datatype) {
              typeProps.push(`datatype: "${field.datatype}"`);
            }
            
            if (field.enumValues) {
              typeProps.push(`enum: [${field.enumValues.map(v => `"${v}"`).join(', ')}]`);
            }
            
            // Build the type definition
            if (field.type === "array") {
              if (field.refModel) {
                typeDefinition = `[{ type: Schema.Types.ObjectId, ref: '${field.refModel}' }]`;
              } else {
                const arrayTypeProps = ['type: String'];
                if (field.datatype) {
                  arrayTypeProps.push(`datatype: "${field.datatype}"`);
                }
                if (field.enumValues) {
                  arrayTypeProps.push(`enum: [${field.enumValues.map(v => `"${v}"`).join(', ')}]`);
                }
                typeDefinition = `[{ ${arrayTypeProps.join(', ')} }]`;
              }
            } else if (field.refModel) {
              typeDefinition = `[{ type: Schema.Types.ObjectId, ref: '${field.refModel}' }]`;
            } else {
              typeDefinition = `{ ${typeProps.join(', ')} }`;
            }
            
            return `  ${field.name}: ${typeDefinition}`;
          })
          .join(",\n");
      };

      const capitalizeType = (type) => {
        const mapping = { string: "String", number: "Number", boolean: "Boolean", date: "Date", object: "Object" };
        return mapping[type] || "String";
      };
      
      const formattedFields = formatFields(fields);
      
      // Generate all required files
      const modelContent = generateModelCode(modelName, formattedFields);
      const apiContent = generateApiCode(modelName, fields);
      const externalApiContent = generateApiWithTokenSupport(modelName, fields);
      const pageContent = generatePageCode(modelName, fields);
      const componentContent = generateComponentCode(modelName, fields);
      const createPageContent = generateCreateFormCode(modelName);
      const editPageContent = generateEditFormCode(modelName);
      
      // Define paths for all files
      const modelPath = path.join(process.cwd(), "models", `${ModelName}.js`);
      const apiPath = path.join(process.cwd(), "pages", "api", `${modelName.toLowerCase()}.js`);
      const extApiPath = path.join(process.cwd(), "pages", "api", "public", `${modelName.toLowerCase()}.js`);
      const pageFolderPath = path.join(process.cwd(), "pages", "manager", modelName.toLowerCase());
      const editPagePath = path.join(pageFolderPath, "edit", "[...id].js");
      const componentPath = path.join(process.cwd(), "components", `${ModelName}.js`);
      
      // Create necessary directories
      if (!fs.existsSync(pageFolderPath)) fs.mkdirSync(pageFolderPath, { recursive: true });
      if (!fs.existsSync(path.dirname(editPagePath))) fs.mkdirSync(path.dirname(editPagePath), { recursive: true });
      
      // Write all files
      fs.writeFileSync(modelPath, modelContent);
      fs.writeFileSync(apiPath, apiContent);
      fs.writeFileSync(extApiPath, externalApiContent);
      fs.writeFileSync(path.join(pageFolderPath, "index.js"), pageContent);
      fs.writeFileSync(path.join(pageFolderPath, "create.js"), createPageContent);
      fs.writeFileSync(editPagePath, editPageContent);
      fs.writeFileSync(componentPath, componentContent);
      
      console.log('All User model files regenerated successfully');
      
      // Signal for restart
      try {
        const touchFile = path.join(process.cwd(), '.needs-restart');
        fs.writeFileSync(touchFile, new Date().toString());
        console.log('Signaled for application restart');
      } catch (restartError) {
        console.warn('Could not signal for restart:', restartError);
        // Not critical, continue
      }
      
      return res.status(200).json({
        success: true,
        message: 'User model and all related files regenerated successfully'
      });
    } catch (error) {
      console.error('Error regenerating User model files:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to regenerate User model files',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in regenerate-user-model endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process request'
    });
  }
} 