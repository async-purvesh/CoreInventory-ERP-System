const jwt = require('jsonwebtoken');

async function identifyUser(req , res , next) {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const token = bearerToken || req.cookies.JWT_Token || req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' })
    }

    let decoded = null

    try {
        decoded = jwt.verify(token , process.env.JWT_SECRET_KEY)
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is not valid' })
    }
}

module.exports = identifyUser;