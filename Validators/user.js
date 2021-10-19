const {check, validationResult} = require('express-validator');
exports.validateLoginRequest = [
    check('email')
    .notEmpty()
    .withMessage('Username is Required'),
    check('password')
    .isLength({min: 4})
    .withMessage('Password must be atleast 4 character long')
];

exports.validateTasklistRequest = [
    check('tasklistname')
    .notEmpty()
    .withMessage('Tasklist is Required')
];

exports.isRequestValidated = (req, res, next) => {
    const errors = validationResult(req);
    if(errors.array().length > 0){
        return res.send({error: errors.array()[0].msg})
    }
    next();
}