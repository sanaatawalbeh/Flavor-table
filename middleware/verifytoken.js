require("dotenv").config();
const jwt = require("jsonwebtoken");

function routeGuard(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).send("No token provided, Access Denied");

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Token malformed, Access Denied");

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    return res.status(403).send("Invalid or expired token");
  }
}


module.exports = routeGuard;
