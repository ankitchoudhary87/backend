const express = require('express')
const {validateLoginRequest, validateTasklistRequest, isRequestValidated} = require('../Validators/user')
const app = express.Router();

const {loginUser, addTasklist, notify, notifytest, allUserList, crongh, allUserList________oLDDDD} = require('../Controller/UserController');

app.route('/login').post(validateLoginRequest, isRequestValidated, loginUser);
app.route('/tasklistAdd').post(validateTasklistRequest, isRequestValidated, addTasklist);
app.route('/ghUserList').post(allUserList);
app.route('/notifications').post(notifytest);
app.route('/ghcron').get(crongh);
//app.route('/userdata/:id').get(singleUserDaata);
//app.route('/userdelete/:id').delete(userDelete);
//app.route('/editUser/:userID').put(validateUpdateUserRequest, isRequestValidated, updateUser);
//app.route('/changeStatus/:userID').put(changeUserStatus);
//app.route('/forgot').post(forgotPassword);

module.exports = app;