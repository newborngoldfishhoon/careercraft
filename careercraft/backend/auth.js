const jwt = require("jsonwebtoken");

// In a real deployment this must come from an environment variable.
// A fixed dev fallback is fine for local development only.
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

// Attaches req.userId when a valid Bearer token is present. Does not reject
// the request on its own — routes decide whether auth is required.
function attachUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  req.userId = payload ? payload.sub : null;
  next();
}

// Use on routes that require a logged-in user.
function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: "Sign in required." });
  next();
}

module.exports = { signToken, verifyToken, attachUser, requireAuth };
