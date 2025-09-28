const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    console.log("Auth middleware: received request.");
    const authHeader = req.headers['authorization'];
    console.log("Auth middleware: Authorization header:", authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Auth middleware: extracted token:", token);

    if (token == null) {
        console.log("Auth middleware: No token provided. Sending 401.");
        return res.sendStatus(401); // if there isn't any token
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Auth middleware: Token verification failed. Error:", err.message);
            return res.sendStatus(403); // if the token is no longer valid
        }
        console.log("Auth middleware: Token verified. User:", user);
        req.user = user;
        next(); // proceed to the next middleware or route handler
    });
};

module.exports = { authenticateToken };