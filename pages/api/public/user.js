import { dbConnect } from "@/lib/dbConnect";
  import { User } from "@/models/User";
  import { verifyApiToken } from "@/lib/verifyApiToken";
  import Cors from 'cors';
  
  // Initialize CORS middleware
  const cors = Cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    origin: true, // Allow all origins in development
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  // Helper method to wait for a middleware to execute before continuing
  function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
      fn(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
  }
  
  export default async function handler(req, res) {
    try {
      // Handle OPTIONS request separately
      if (req.method === 'OPTIONS') {
        await runMiddleware(req, res, cors);
        return res.status(204).end();
      }

      // Run the CORS middleware for other requests
      await runMiddleware(req, res, cors);
      
      await dbConnect();
      const tokenData = await verifyApiToken(req, res);
      if (!tokenData) return;
  
      const { method } = req;
  
      if (method === "GET") {
        if (!["full_access", "read_only"].includes(tokenData.tokenType)) {
          return res.status(403).json({ error: "Permission denied" });
        }
  
        const { 
          id, 
          page = 1, 
          limit = 10, 
          user, 
          search,
          sort = '-createdAt',
          fields,
          filter,
          populate: populateFields
        } = req.query;
  
        if (id) {
          let query = User.findById(id);
          const refFields = [];
          if (refFields.length) {
            refFields.forEach(field => {
              query = query.populate(field);
            });
          }
          const item = await query;
          if (!item) {
            return res.status(404).json({ error: "Item not found" });
          }
          return res.json(item);
        }
  
        // Build query
        const query = user ? { user } : {};
        
        // Handle search
        if (search && typeof search === 'string') {
          const searchableFields = ['firstname', 'lastname', 'email', 'userRole'];
          query.$or = searchableFields.map(field => ({
            [field]: { $regex: search, $options: 'i' }
          }));
        }
  
        // Handle filters
        if (filter) {
          try {
            const filterObj = JSON.parse(filter);
            // Convert string 'true'/'false' to boolean values
            Object.keys(filterObj).forEach(key => {
              if (filterObj[key] === 'true') {
                filterObj[key] = true;
              } else if (filterObj[key] === 'false') {
                filterObj[key] = false;
              }
            });
            Object.assign(query, filterObj);
          } catch (error) {
            return res.status(400).json({ error: "Invalid filter format" });
          }
        }
  
        // Handle field selection
        const selectFields = fields ? fields.split(',').join(' ') : null;
  
        // Handle custom populate
        const customPopulate = populateFields ? 
          populateFields.split(',').map(field => field.trim()) : 
          [];
  
        // Handle sorting
        const sortFields = sort.split(',').map(field => {
          const order = field.startsWith('-') ? -1 : 1;
          const fieldName = field.replace(/^-/, '');
          return [fieldName, order];
        });
  
        const total = await User.countDocuments(query);
        let queryBuilder = User.find(query)
          .select(selectFields)
          .sort(sortFields)
          .skip((page - 1) * limit)
          .limit(parseInt(limit));

        if (customPopulate.length) {
          customPopulate.forEach(field => {
            queryBuilder = queryBuilder.populate(field);
          });
        }

        const items = await queryBuilder;
    
        return res.json({
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
          items,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        });
      }
  
      if (method === "POST") {
        if (!["full_access", "create_only"].includes(tokenData.tokenType)) {
          return res.status(403).json({ error: "Permission denied" });
        }
  
        const { firstname, lastname, email, password, userRole, block, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        const doc = await User.create({ firstname, lastname, email, password, userRole, block, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription });
        return res.json(doc);
      }
  
      if (method === "PUT") {
        if (!["full_access", "edit_only"].includes(tokenData.tokenType)) {
          return res.status(403).json({ error: "Permission denied" });
        }
  
        const { _id, firstname, lastname, email, password, userRole, block, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription } = req.body;
        await User.updateOne({ _id }, { firstname, lastname, email, password, userRole, block, user, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription });
        return res.json(true);
      }
  
      if (method === "DELETE") {
        if (!["full_access", "delete_only"].includes(tokenData.tokenType)) {
          return res.status(403).json({ error: "Permission denied" });
        }
  
        const { id } = req.query;
        await User.deleteOne({ _id: id });
        return res.json(true);
      }
  
      res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }