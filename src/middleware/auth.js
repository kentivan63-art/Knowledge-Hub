// Authentication middleware to check if user is logged in
export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Please log in." });
  }
}
