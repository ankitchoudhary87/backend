const jwt = require('jsonwebtoken');
const env = require('dotenv');
// environment variable or you can say constants
env.config();

exports.requireSignin = (req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET);
        //console.log(user)
        req.user = user;
    }else{
        return res.send({message: "Authorization is Required!"})
    }
    next();
}

exports.adminMiddleware = (req, res, next) => {
    if (req.user.user_type !== 'Super Admin') {
        return res.send({ message: "Access Denied" })
    }
    next();
}