import { dbConnect } from "@/lib/dbConnect";
    import { User } from "@/models/User";
    import { getServerSession } from "next-auth/next";
    import { authOptions } from "@/pages/api/auth/[...nextauth]";
    import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
    import { withDynamicModels, getModelForApi } from "@/lib/apiUtils";
    
    import bcrypt from "bcryptjs";

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

    // Get the User model dynamically to ensure schema is up-to-date
    const User = await getModelForApi('user');

    if (method === "POST") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const { firstname, lastname, email, password, userRole, block, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        
    // Handle password hashing
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    
        const dataDoc = await User.create({
        firstname, lastname, email, password, userRole, block, user, 
        password: hashedPassword,
        seoTitle, 
        seoDescription, 
        focusKeywords, 
        canonicalUrl, 
        metaRobots, 
        openGraphTitle, 
        openGraphDescription,
        user: session.user.id
        });
        
        res.json(dataDoc);
    }

    if (method === "GET") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.READ)) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const { id, page = 1, limit = 10, search } = req.query;
        if (id) {
            const item = await User.findById(id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        
        return res.json(item);
        }

        const query = {};
        
        // Add search functionality
        if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchableFields = ['firstname', 'lastname', 'email', 'password', 'userRole', 'block'];
        query.$or = searchableFields.map(field => ({
            [field]: searchRegex
        }));
        }

        const total = await User.countDocuments(query);
        const items = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
    }

    if (method === "PUT") {
        if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
        return res.status(403).json({ message: "Permission denied" });
        }

        const { _id, firstname, lastname, email, password, userRole, block, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        
        // Check if item exists and user has permission
        const existingItem = await User.findById(_id);
        if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
        }
    
        
    // Handle password hashing for updates
    let hashedPassword = existingItem.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    
        
        await User.updateOne({ _id }, {
        firstname, lastname, email, password, userRole, block, user, 
        password: hashedPassword,
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
        const item = await User.findById(req.query.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Prevent deleting the last superadmin
        if (item.userRole === 'superadmin') {
            const superadminCount = await User.countDocuments({ userRole: 'superadmin' });
            if (superadminCount <= 1) {
            return res.status(409).json({ message: "Cannot delete the last superadmin user" });
            }
        }
    
        
        await User.deleteOne({ _id: req.query.id });
        res.json(true);
        }
    }
    }

    // Wrap handler with dynamic model support
    export default withDynamicModels(handler);