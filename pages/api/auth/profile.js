import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import bcrypt from "bcryptjs";
import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";



const checkAuth = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return session;
};


export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;


  if (method === "GET") {
    const session = await checkAuth(req, res);
    if (!session) return;

    
    const { id, page = 1, limit = 10, user, email } = req.query;
    if (id) {
      const item = await User.findById(id);
      return res.json(item);
    }
    if (email) {
      const item = await User.findOne({ email });
      return res.json(item);
    }
    const query = user ? { user } : {};
    const total = await User.countDocuments(query);
    const items = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
  }

  if (method === "PUT") {
    const session = await checkAuth(req, res);
    if (!session) return;

    if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    const { _id, firstname, lastname, email, password, block, userRole, avtar } = req.body;

    // Check if item exists and user has permission
    const existingItem = await User.findById(_id);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only hash password if it's being changed
    let hashedPassword = existingItem.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    await User.updateOne({ _id }, {
      firstname, 
      lastname, 
      email, 
      password: hashedPassword, 
      block, 
      userRole, 
      avtar
    });
    res.json(true);
  }
}