const conn = require('../utils/dbConnection');
const env = require('dotenv');
const webpush = require('web-push')
env.config();
webpush.setVapidDetails(process.env.WEB_PUSH_CONTACT, process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    //const checkAccess = "SELECT * FROM users WHERE user_name = ?";
    const checkAccess = "SELECT u.*, case WHEN g.id!='' then 1 else 0 END as gh FROM users u left join group_change_log g on u.user_id=g.group_head WHERE user_name = ? group by u.user_id";
    conn.query(checkAccess, [email], async (err, user) => {
        if (err) {
            res.send({ message: err })
        } else {
            if (user && user.length > 0) {
                if (user[0].password === password) {
                    const { user_id, user_name, name, employee_code, gh } = user[0];
                    res.send({
                        message: "Login Successfully",
                        user: { user_id, user_name, name, employee_code, gh }
                    })
                } else {
                    res.send({ message: "Password didn't match" })
                }
            } else {
                res.send({ message: "User not registered!" })
            }
        }
    })
}

exports.addTasklist = async (req, res) => {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // getMonth returns a zero-based index of the month: 0-11
    let day = date.getDate(); // 0 - 31
    let hours = date.getHours(); // 0 - 23
    let minutes = date.getMinutes(); // 0 - 59
    let seconds = date.getSeconds(); // 0 - 59
    if (month < 10) { month = '0' + month }
    if (day < 10) { day = '0' + day }
    if (hours < 10) { hours = '0' + hours }
    if (minutes < 10) { minutes = '0' + minutes }
    if (seconds < 10) { seconds = '0' + seconds }
    const finaldate = year + '-' + month + '-' + day;
    const finaltime = hours + ':' + minutes + ':' + seconds;
    inputData = {
        user_id: req.body.user_id,
        tasklist: req.body.tasklistname,
        taskchallenge: req.body.taskchallenge
    }
    // Insert data to tasklist databse table
    const insertSql = "INSERT INTO tasklist SET ?";
    conn.query(insertSql, inputData, (err, tasks) => {
        if (err) {
            res.send({ message: err })
        } else {
            if (tasks) {
                res.send({ message: "Tasklist Added Successfully", taskdata: tasks });
            } else {
                res.send({ message: "Something went wrong while adding the data." });
            }
        }
    })
}

exports.allUserList = (req, res) => {
    const { start_date, end_date, resource, gh_id } = req.body;
    let userID = req.body.gh_id;
    let userIDs = "";
    let userquery = '';
    let dateQuery = '';
    if (resource && resource !== '') {
        userquery = ' AND user_id =' + resource;
    }

    if ((start_date && start_date !== '' && start_date !== null) && (end_date && end_date !== '' && end_date !== null)) {
        let fromDate = new Date(start_date);
        let pfromdate = fromDate.toISOString().split('T')[0];
        let toDate = new Date(end_date);
        let ptodate = toDate.toISOString().split('T')[0];
        dateQuery = " created_date BETWEEN '" + pfromdate + "' AND '" + ptodate + "' AND ";
    } else if ((start_date && start_date !== '' && start_date !== null) && (end_date === '' || end_date === null)) {
        let fromDate = new Date(start_date);
        let pfromdate = fromDate.toISOString().split('T')[0];
        dateQuery = " created_date >='" + pfromdate + "' AND ";
    } else if ((start_date === '' || start_date === null) && (end_date && end_date !== '' && end_date !== null)) {
        let toDate = new Date(end_date);
        let ptodate = toDate.toISOString().split('T')[0];
        dateQuery = " created_date <='" + ptodate + "' AND ";
    } else {
        dateQuery = " DATE_FORMAT(created_date, '%Y-%m-%d') > now() - interval 8 day AND ";
    }
    //const ghAllusersQuery = "SELECT user_id, name, employee_code FROM users WHERE under_gh = ?";
    //const ghusersQuery = "SELECT user_id, name, employee_code FROM users WHERE" + userquery + " under_gh = ?";
    const ghAllusersQuery = "SELECT user_id, name, employee_code FROM users where user_id IN (SELECT user_id FROM group_change_log where group_head = ?)";
    const ghusersQuery = "SELECT user_id, name, employee_code FROM users where user_id IN (SELECT user_id FROM group_change_log where group_head = ? )" + userquery;
    conn.query(ghAllusersQuery, [gh_id], (err_users, alluserlist) => {
        if (err_users) {
            res.send({ message: err_users })
        } else {
            conn.query(ghusersQuery, [gh_id], (err, userdata) => {
                if (err) {
                    res.send({ message: err })
                } else {
                    if (userdata && userdata.length > 0) {
                        userdata.map((datauser) => {
                            userIDs += datauser.user_id + ','
                        })
                        if (userIDs && userIDs !== '') {
                            struserID = userIDs.replace(/,\s*$/, "");
                            if (struserID && struserID !== '') {
                                const userDataQuery = "SELECT DATE_FORMAT(created_date, '%Y-%m-%d') as created_date, created_time, tasklist, user_id, DATE_FORMAT(created_by, '%Y-%m-%d') as date, DATE_FORMAT(created_by, '%H:%i:%s') as time, TIME_TO_SEC(created_time)*1000 as time_seconds FROM tasklist where" + dateQuery + "user_id IN (" + struserID + ")";
                                //console.log("Query = ", userDataQuery)
                                conn.query(userDataQuery, (errnew, taskdata) => {
                                    if (errnew) {
                                        res.send({ message: errnew })
                                    } else {
                                        if (taskdata) {
                                            res.send({ message: "user list fetched", userdatalist: alluserlist, userdata: userdata, tasklistdata: taskdata })
                                        }
                                    }
                                })
                            }
                        }
                    } else {
                        res.send({ message: "Data not found!" })
                    }
                }
            })
        }
    })
}
const mysql = require('mysql2/promise');
// create the connection to database
const connection = async () => {
    return await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'whosin'
    })
}
exports.allUserList________oLDDDD = async (req, res) => {
    const db = await connection()
    const { start_date, end_date, resource, gh_id } = req.body;
    let userID = req.body.gh_id;
    const ghAllusersQuery = await db.query('SELECT user_id, name, employee_code FROM users where user_id IN (SELECT user_id FROM group_change_log where group_head = ?)', [userID]);
    const userdata = await db.query('SELECT user_id, name, employee_code FROM users where user_id IN (SELECT user_id FROM group_change_log where group_head = ?)', [userID]);
    //console.log(userdata[0])
    if (ghAllusersQuery[0] && ghAllusersQuery[0].length > 0) {
        if (userdata[0] && userdata[0].length > 0) {
            let userTasklist = [];
            let data = new Array();
            await Promise.all(
                userdata[0].map(async (datauser) => {
                    var objtask = {}
                    const taskdata = await db.query("SELECT DATE_FORMAT(created_date, '%Y-%m-%d') as created_date, created_time, tasklist, user_id, DATE_FORMAT(created_by, '%Y-%m-%d') as date, DATE_FORMAT(created_by, '%H:%i:%s') as time, TIME_TO_SEC(created_time)*1000 as time_seconds FROM tasklist where user_id = ?", [datauser.user_id]);
                    if (taskdata[0]) {
                        taskdata[0].map(async (taskdatalist) => {
                            objtask = {
                                userid: datauser.user_id,
                                name: datauser.name,
                                employee_code: datauser.employee_code,
                                created_date: taskdatalist.created_date,
                                created_time: taskdatalist.created_time,
                                tasklist: taskdatalist.tasklist,
                                date: taskdatalist.date,
                                time: taskdatalist.time,
                                time_seconds: taskdatalist.time_seconds
                            }
                            userTasklist.push(objtask)
                        })
                    }
                })
            )
            /*
            data[taskdatalist.date][datauser.user_id]['user_id'] = datauser.user_id;
            data[taskdatalist.date][datauser.user_id]['name'] = datauser.name;
            data[taskdatalist.date][datauser.user_id]['employee_code'] = datauser.employee_code;
            data[taskdatalist.date][datauser.user_id]['created_date'] = taskdatalist.created_date;
            data[taskdatalist.date][datauser.user_id]['created_time'] = taskdatalist.created_time;
            if (taskdatalist.time_seconds == 1) {
                data[taskdatalist.date][datauser.user_id]['tasklist1'] = taskdatalist.tasklist;
            } else if (taskdatalist.time_seconds == 2) {
                data[taskdatalist.date][datauser.user_id]['tasklist2'] = taskdatalist.tasklist;
            } else if (taskdatalist.time_seconds == 3) {
                data[taskdatalist.date][datauser.user_id]['tasklist3'] = taskdatalist.tasklist;
            }
            data[taskdatalist.date][datauser.user_id]['time'] = taskdatalist.time;
            data[taskdatalist.date][datauser.user_id]['time_seconds'] = taskdatalist.time_seconds;


            userTasklist.map(async (userTasklistdata) => {
                data[userTasklistdata.date][userTasklistdata.userid]['user_id'] = userTasklistdata.userid;
                data[userTasklistdata.date][userTasklistdata.userid]['name'] = userTasklistdata.name;
                data[userTasklistdata.date][userTasklistdata.userid]['employee_code'] = userTasklistdata.employee_code;
                data[userTasklistdata.date][userTasklistdata.userid]['created_date'] = userTasklistdata.created_date;
                data[userTasklistdata.date][userTasklistdata.userid]['created_time'] = userTasklistdata.created_time;
                if (userTasklistdata.time_seconds == 1) {
                    data[userTasklistdata.date][userTasklistdata.userid]['tasklist1'] = userTasklistdata.tasklist;
                } else if (userTasklistdata.time_seconds == 2) {
                    data[userTasklistdata.date][userTasklistdata.userid]['tasklist2'] = userTasklistdata.tasklist;
                } else if (userTasklistdata.time_seconds == 3) {
                    data[userTasklistdata.date][userTasklistdata.userid]['tasklist3'] = userTasklistdata.tasklist;
                }
                data[userTasklistdata.date][userTasklistdata.userid]['time'] = userTasklistdata.time;
                data[userTasklistdata.date][userTasklistdata.userid]['time_seconds'] = userTasklistdata.time_seconds;
            })
            */
            console.log(data)
            res.send({ message: "user list fetched", userdatalist: ghAllusersQuery[0], userdata: userdata[0], tasklistdata: userTasklist })
        }
    }
}

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    UserModel.findOne({ email: email }, async (err, user) => {
        if (err) {
            res.send({ message: err })
        } else {
            if (user) {
                if (user.status == true) {
                    const r = (Math.random() + 1).toString(36).substring(5);
                    const decryptedPass = await bcrypt.hash(r, saltRounds);
                    let updatedpassword = {
                        password: decryptedPass
                    }
                    UserModel.findOneAndUpdate({ _id: user._id }, updatedpassword, { new: true }, (errnew, result) => {
                        if (errnew) {
                            res.send({ message: errnew })
                        } else {
                            // Send Password to registedred Email ID
                            var mailOptions = {
                                from: 'no-reply@gmail.com',
                                to: user.email,
                                // to: 'myfriend@yahoo.com, myotherfriend@yahoo.com',
                                subject: 'Forgot Password - Node App',
                                //text: 'That was easy!'
                                html: '<p>Hello, Please find the new password below:<br>' + r + '</p>'
                            };
                            // Sent Email
                            transporter.sendMail(mailOptions, function (errorlatest, info) {
                                if (errorlatest) {
                                    res.send({ message: errorlatest.response })
                                } else {
                                    res.send({ message: "New Password sent to your registered email address. Please check your email.", data: result });
                                }
                            });
                        }
                    })
                } else {
                    res.send({ message: "Account is not Active Yet. Please contact Administrator!" })
                }
            } else {
                res.send({ message: "User not registered!" })
            }
        }
    })
}

exports.notify = (req, res) => {
    const subscription = req.body

    console.log(subscription)

    const payload = JSON.stringify({
        title: 'Hello!',
        body: 'It works.'
    })

    webpush.sendNotification(subscription, payload)
        .then(result => console.log(result))
        .catch(e => console.log(e.stack))

    res.status(200).json({ 'success': true })

}