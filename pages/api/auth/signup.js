import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";


export default async function handler(req, res) {
    if(req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { firstname, lastname, email, password } = req.body;
        const db = await dbConnect();

        // count how many users already exist
        const userCount = await User.countDocuments();

        // if any user exists, disallow further registration
        if(userCount > 0) {
            return res.status(403).json({ message: "You don't have an access to register" });
        }

        // check if user already exists by email (extra safety)
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user with superadmin role (first user)
        const result = await User.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            userRole: 'superadmin',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return res.status(201).json({ 
            message: "User created successfully", 
            user: { id: result.insertedId, firstname, lastname, email, userRole: 'superadmin' } 
        });

    } catch (error) {
        console.error('Signup error', error);
        return res.json(500).json({ message: "Internal server error" });
    }
};




