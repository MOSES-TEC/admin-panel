import { dbConnect } from "@/lib/dbConnect";
    import { Developer } from "@/models/Developer";
    import { getServerSession } from "next-auth/next";
    import { authOptions } from "@/pages/api/auth/[...nextauth]";
    import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
    import { withDynamicModels, getModelForApi } from "@/lib/apiUtils";
    import { User } from "@/models/User";
    

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

    // Get the Developer model dynamically to ensure schema is up-to-date
    const Developer = await getModelForApi('developer');

    if (method === "POST") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const { icon, seller, Date, users, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        
        const dataDoc = await Developer.create({
        icon, seller, Date, users, user, 
        
        seoTitle, 
        seoDescription, 
        focusKeywords, 
        canonicalUrl, 
        metaRobots, 
        openGraphTitle, 
        openGraphDescription,
        user: session.user.id
        });
        
      // Add this Developer to User's developers
      if (users?.length) {
        await Promise.all(users.map(id =>
          User.findByIdAndUpdate(id, {
            $addToSet: { developers: dataDoc._id }
          })
        ));
      }
    
        res.json(dataDoc);
    }

    if (method === "GET") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.READ)) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const { id, page = 1, limit = 10, search } = req.query;
        if (id) {
            const item = await Developer.findById(id).populate('users');
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        
        return res.json(item);
        }

        const query = {};
        
        // Add search functionality
        if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchableFields = ['icon', 'seller', 'Date'];
        query.$or = searchableFields.map(field => ({
            [field]: searchRegex
        }));
        }

        const total = await Developer.countDocuments(query);
        const items = await Developer.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)).populate('users');

        res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
    }

    if (method === "PUT") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
        return res.status(403).json({ message: "Permission denied" });
        }

        const { _id, icon, seller, Date, users, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        
        // Check if item exists and user has permission
        const existingItem = await Developer.findById(_id);
        if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
        }
    
        
        
      // Sync User's developers on UPDATE
      const existingDoc = await Developer.findById(_id);
      const oldIds = existingDoc.users.map(id => id.toString());
      const newIds = users.map(id => id.toString());
  
      const removed = oldIds.filter(id => !newIds.includes(id));
      const added = newIds.filter(id => !oldIds.includes(id));
  
      await Promise.all(removed.map(id =>
        User.findByIdAndUpdate(id, {
          $pull: { developers: _id }
        })
      ));
      await Promise.all(added.map(id =>
        User.findByIdAndUpdate(id, {
          $addToSet: { developers: _id }
        })
      ));
    
        await Developer.updateOne({ _id }, {
        icon, seller, Date, users, user, 
        
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
        const item = await Developer.findById(req.query.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Prevent deleting the last superadmin
        if (item.userRole === 'superadmin') {
            const superadminCount = await Developer.countDocuments({ userRole: 'superadmin' });
            if (superadminCount <= 1) {
            return res.status(409).json({ message: "Cannot delete the last superadmin user" });
            }
        }
    
        
      // Cleanup from User's developers on DELETE
      const deletingDoc = await Developer.findById(req.query.id);
      await Promise.all(deletingDoc.users.map(id =>
        User.findByIdAndUpdate(id, {
          $pull: { developers: req.query.id }
        })
      ));
    
        await Developer.deleteOne({ _id: req.query.id });
        res.json(true);
        }
    }
    }

    // Wrap handler with dynamic model support
    export default withDynamicModels(handler);