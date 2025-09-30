
export const generateApiCode = (modelName, fields) => {
    // Special capitalization for known model names like YouTube
    const capitalizeModelName = (name) => {
      // Handle special case names
      if (name.toLowerCase() === 'youtube') return 'YouTube';
      
      // Default capitalization
      return name.charAt(0).toUpperCase() + name.slice(1);
    };
    
    const ModelName = capitalizeModelName(modelName);
  
    const normalFields = fields.filter((f) => !f.refModel).map((f) => f.name);
    const refFields = fields.filter((f) => f.refModel);
    const allFieldsString = [...normalFields, ...refFields.map((f) => f.name), "user"].join(", ");
  
    // Get searchable fields (excluding image and file types)
    const searchableFields = fields
      .filter(f => !f.refModel && f.type !== 'image' && f.type !== 'file')
      .map(f => f.name);
    const searchFieldsString = searchableFields.map(f => `'${f}'`).join(', ');
  
    const populateCode = refFields.length
      ? `.populate(${refFields.map((f) => `'${f.name}'`).join(").populate(")})`
      : "";
  
    const refSyncOnCreate = refFields.map((f) => `
      // Add this ${ModelName} to ${f.refModel}'s ${f.reverseField || modelName.toLowerCase() + 's'}
      if (${f.name}?.length) {
        await Promise.all(${f.name}.map(id =>
          ${f.refModel}.findByIdAndUpdate(id, {
            $addToSet: { ${f.reverseField || modelName.toLowerCase() + 's'}: dataDoc._id }
          })
        ));
      }
    `).join("");
  
    const refSyncOnUpdate = refFields.map((f) => `
      // Sync ${f.refModel}'s ${f.reverseField || modelName.toLowerCase() + 's'} on UPDATE
      const existingDoc = await ${ModelName}.findById(_id);
      const oldIds = existingDoc.${f.name}.map(id => id.toString());
      const newIds = ${f.name}.map(id => id.toString());
  
      const removed = oldIds.filter(id => !newIds.includes(id));
      const added = newIds.filter(id => !oldIds.includes(id));
  
      await Promise.all(removed.map(id =>
        ${f.refModel}.findByIdAndUpdate(id, {
          $pull: { ${f.reverseField || modelName.toLowerCase() + 's'}: _id }
        })
      ));
      await Promise.all(added.map(id =>
        ${f.refModel}.findByIdAndUpdate(id, {
          $addToSet: { ${f.reverseField || modelName.toLowerCase() + 's'}: _id }
        })
      ));
    `).join("");
  
    const refCleanupOnDelete = refFields.map((f) => `
      // Cleanup from ${f.refModel}'s ${f.reverseField || modelName.toLowerCase() + 's'} on DELETE
      const deletingDoc = await ${ModelName}.findById(req.query.id);
      await Promise.all(deletingDoc.${f.name}.map(id =>
        ${f.refModel}.findByIdAndUpdate(id, {
          $pull: { ${f.reverseField || modelName.toLowerCase() + 's'}: req.query.id }
        })
      ));
    `).join("");
  
    const refModels = refFields.map((f) => f.refModel);
    const importRefModels = refModels.length > 0
      ? `import { ${[...new Set(refModels)].join(", ")} } from "@/models/${refModels}";`
      : "";

    // Check if there's a password field
    const hasPasswordField = fields.some(f => f.name === 'password');
    const passwordHandlingCode = hasPasswordField ? `
    // Handle password hashing
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    ` : '';

    const passwordUpdateCode = hasPasswordField ? `
    // Handle password hashing for updates
    let hashedPassword = existingItem.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    ` : '';
  
    return `
    import { dbConnect } from "@/lib/dbConnect";
    import { ${ModelName} } from "@/models/${ModelName}";
    import { getServerSession } from "next-auth/next";
    import { authOptions } from "@/pages/api/auth/[...nextauth]";
    import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
    import { withDynamicModels, getModelForApi } from "@/lib/apiUtils";
    ${importRefModels}
    ${hasPasswordField ? 'import bcrypt from "bcryptjs";' : ''}

    const checkAuth = async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return session;
    };

    async function handler(req, res) {
    await dbConnect();
    const { method } = req;
    const session = await checkAuth(req, res);
    if (!session) return;

    // Get the ${ModelName} model dynamically to ensure schema is up-to-date
    const ${ModelName} = await getModelForApi('${modelName}');

    if (method === "POST") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const { ${allFieldsString}, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        ${passwordHandlingCode}
        const dataDoc = await ${ModelName}.create({
        ${allFieldsString}, 
        ${hasPasswordField ? 'password: hashedPassword,' : ''}
        seoTitle, 
        seoDescription, 
        focusKeywords, 
        canonicalUrl, 
        metaRobots, 
        openGraphTitle, 
        openGraphDescription,
        user: session.user.id
        });
        ${refSyncOnCreate}
        res.json(dataDoc);
    }

    if (method === "GET") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.READ)) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const { id, page = 1, limit = 10, search } = req.query;
        if (id) {
            const item = await ${ModelName}.findById(id)${populateCode};
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        
        return res.json(item);
        }

        const query = {};
        
        // Add search functionality
        if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchableFields = [${searchFieldsString}];
        query.$or = searchableFields.map(field => ({
            [field]: searchRegex
        }));
        }

        const total = await ${ModelName}.countDocuments(query);
        const items = await ${ModelName}.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))${populateCode};

        res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
    }

    if (method === "PUT") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
        return res.status(403).json({ message: "Permission denied" });
        }

        const { _id, ${allFieldsString}, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        
        // Check if item exists and user has permission
        const existingItem = await ${ModelName}.findById(_id);
        if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
        }
    
        ${passwordUpdateCode}
        ${refSyncOnUpdate}
        await ${ModelName}.updateOne({ _id }, {
        ${allFieldsString}, 
        ${hasPasswordField ? 'password: hashedPassword,' : ''}
        seoTitle, 
        seoDescription, 
        focusKeywords, 
        canonicalUrl, 
        metaRobots, 
        openGraphTitle, 
        openGraphDescription
        });
        res.json(true);
    }

    if (method === "DELETE") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.DELETE)) {
        return res.status(403).json({ message: "Permission denied" });
        }

        if (req.query?.id) {
        // Check if item exists and user has permission
        const item = await ${ModelName}.findById(req.query.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Prevent deleting the last superadmin
        if (item.userRole === 'superadmin') {
            const superadminCount = await ${ModelName}.countDocuments({ userRole: 'superadmin' });
            if (superadminCount <= 1) {
            return res.status(409).json({ message: "Cannot delete the last superadmin user" });
            }
        }
    
        ${refCleanupOnDelete}
        await ${ModelName}.deleteOne({ _id: req.query.id });
        res.json(true);
        }
    }
    }

    // Wrap handler with dynamic model support
    export default withDynamicModels(handler);
    `.trim();
};
  







