const jwt = require('jsonwebtoken')

module.exports = function verifyToken(req, res, next) {
  const header = req.headers['authorization']
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'lunarae_fallback_secret')
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token — please log in again' })
  }
}
