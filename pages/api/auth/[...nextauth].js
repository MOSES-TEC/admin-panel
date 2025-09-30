import NextAuth from "next-auth";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@/models/User";
import { dbConnect } from "@/lib/dbConnect";


export const authOptions = {
    providers: [

       CredentialsProvider({
         name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },

            async authorize(credentials) {
                try {
                    // connect database
                    await dbConnect();

                    const user = await User.findOne({ email: credentials.email });

                    if(!user) {
                        throw new Error("No User Found with this email");
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if(!isValid) {
                        throw new Error("Invalid password");
                    }

                    if(user.block) {
                        throw new Error("Your account has been blocked");
                    }

                    return {
                        id: user._id.toString(),
                        name: user.firstname,
                        email: user.email,
                        userRole: user.userRole
                    }

                } catch (error) {
                    console.error("Auth error", error);
                    throw new Error(error.message);
                }
            }
       })

    ],

    callbacks: {
        async jwt({ token, user }) {
            if(user) {
                token.userRole = user.userRole;
            }
            return token;
        },

        async session({ session, token }) {
            if(token) {
                session.user.userRole = token.userRole;
            }
            return session;
        }
    },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin'
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // after 30 days token will expire and auto logout
    },

    secret: process.env.NEXTAUTH_SECRET,
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3005' || 'http://localhost:3000'
};


export default NextAuth(authOptions);

