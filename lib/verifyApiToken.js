import jwt from "jsonwebtoken";

/**
 * Verifies JWT token from the request headers.
 * Expects "Authorization: Bearer <token>".
 *
 * @param {object} req - Next.js API request object
 * @returns {object} Decoded token payload if valid
 * @throws {Error} if token is missing or invalid
 */
export default function verifyApiToken(req) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    throw new Error("Authorization header missing");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new Error("Token missing from authorization header");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
