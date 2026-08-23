const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "careercraft-dev-secret-change-me";
const TOKEN_TTL = "30d";

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function attachUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  req.userId = payload ? payload.sub : null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: "Sign in required." });
  next();
}

module.exports = { signToken, verifyToken, attachUser, requireAuth };
