const conn = require('../utils/dbConnection');
var nodemailer = require('nodemailer');
const env = require('dotenv');
const webpush = require('web-push')
env.config();
webpush.setVapidDetails(process.env.WEB_PUSH_CONTACT, process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY)

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'paribaliyan2013',
        pass: 'AmP878513!@#'
    }
});

var get_cookies = function (request) {
    var cookies = {};
    request.headers && request.headers.cookie.split(';').forEach(function (cookie) {
        var parts = cookie.match(/(.*?)=(.*)$/)
        cookies[parts[1].trim()] = (parts[2] || '').trim();
    });
    return cookies;
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // getMonth returns a zero-based index of the month: 0-11
    let day = date.getDate(); // 0 - 31
    if (month < 10) { month = '0' + month }
    if (day < 10) { day = '0' + day }
    const finaldate = year + '-' + month + '-' + day;

    //const checkAccess = "SELECT * FROM users WHERE user_name = ?";
    const checkAccess = "SELECT u.*, case WHEN g.id!='' then 1 else 0 END as gh FROM users u left join group_change_log g on u.user_id=g.group_head WHERE user_name = ? group by u.user_id";
    conn.query(checkAccess, [email], async (err, user) => {
        if (err) {
            res.send({ message: err })
        } else {
            if (user && user.length > 0) {
                if (user[0].password === password) {
                    const { user_id, user_name, name, employee_code, gh } = user[0];
                    if (gh === 0) {
                        inputData = {
                            user_id: user_id,
                            entry_date: finaldate
                        }
                        const insertSql = "INSERT INTO tasklist SET ?";
                        conn.query(insertSql, inputData, (err) => {

                        })
                    }
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
    const currentdatatime = finaldate + ' ' + finaltime
    var finaldatenew = "'" + finaldate + "'";
    const checkAccess = "SELECT * FROM tasklist WHERE user_id = ? AND entry_date = " + finaldatenew;
    conn.query(checkAccess, [req.body.user_id], async (err, user) => {
        if (err) {
            res.send({ message: err })
        } else {
            if (user && user.length > 0) {
                var current_time_in_seconds = hours * 3600 + minutes * 60 + seconds;
                if ((current_time_in_seconds >= 21600 && current_time_in_seconds <= 25200) || (current_time_in_seconds >= 32400 && current_time_in_seconds <= 36000) || (current_time_in_seconds >= 43200 && current_time_in_seconds <= 46800)) {
                    if (current_time_in_seconds >= 21600 && current_time_in_seconds <= 25200) {
                        inputData = {
                            tasklist1: req.body.tasklistname,
                            taskchallenge1: req.body.taskchallenge,
                            created_by1: currentdatatime
                        }
                    } else if (current_time_in_seconds >= 32400 && current_time_in_seconds <= 36000) {
                        inputData = {
                            tasklist2: req.body.tasklistname,
                            taskchallenge2: req.body.taskchallenge,
                            created_by2: currentdatatime
                        }
                    } else if (current_time_in_seconds >= 43200 && current_time_in_seconds <= 46800) {
                        inputData = {
                            tasklist3: req.body.tasklistname,
                            taskchallenge3: req.body.taskchallenge,
                            created_by3: currentdatatime
                        }
                    }
                    // Insert data to tasklist databse table
                    const insertSql = "UPDATE tasklist SET ? where user_id = ? AND entry_date = " + finaldatenew;
                    conn.query(insertSql, [inputData, req.body.user_id], (errnew, tasks) => {
                        if (errnew) {
                            res.send({ message: errnew })
                        } else {
                            if (tasks) {
                                res.send({ message: "Tasklist Added Successfully", taskdata: tasks });
                            } else {
                                res.send({ message: "Something went wrong while adding the data." });
                            }
                        }
                    })
                } else {
                    res.send({ message: "You will not add task at this time."+currentdatatime+"-"+current_time_in_seconds });
                }
            } else {
                res.send({ message: "User not registered!" })
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
        dateQuery = " entry_date BETWEEN '" + pfromdate + "' AND '" + ptodate + "' AND ";
    } else if ((start_date && start_date !== '' && start_date !== null) && (end_date === '' || end_date === null)) {
        let fromDate = new Date(start_date);
        let pfromdate = fromDate.toISOString().split('T')[0];
        dateQuery = " entry_date >='" + pfromdate + "' AND ";
    } else if ((start_date === '' || start_date === null) && (end_date && end_date !== '' && end_date !== null)) {
        let toDate = new Date(end_date);
        let ptodate = toDate.toISOString().split('T')[0];
        dateQuery = " entry_date <='" + ptodate + "' AND ";
    } else {
        dateQuery = " DATE_FORMAT(entry_date, '%Y-%m-%d') > now() - interval 8 day AND ";
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
                                const userDataQuery = "SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') as date, user_id, tasklist1, taskchallenge1, tasklist2, taskchallenge2, tasklist3, taskchallenge3 FROM tasklist where" + dateQuery + "user_id IN (" + struserID + ")";
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
        host: 'sql6.freemysqlhosting.net',
        user: 'sql6445658',
        password: 'SUnXdEZYQE',
        database: 'sql6445658'
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
    const currentdatatime = finaldate + ' ' + finaltime
    const subscription = req.body.subdata
    let userID = req.body.cokkID;
    let currdate = finaldate;
    var finaldatenew = "'" + finaldate + "'";
    let set_title = '3 Times Reporting!';
    var current_time_in_seconds1 = hours * 3600 + minutes * 60 + seconds;
    let tasktypecol = ''
    let tasktime = ''
    if (current_time_in_seconds1 >= 21600 && current_time_in_seconds1 <= 25200) {
        tasktypecol = 'tasklist1';
        tasktime = '12PM';
    } else if (current_time_in_seconds1 >= 32400 && current_time_in_seconds1 <= 42000) {
        tasktypecol = 'tasklist2';
        tasktime = '3PM';
    } else if (current_time_in_seconds1 >= 43200 && current_time_in_seconds1 <= 46800) {
        tasktypecol = 'tasklist3';
        tasktime = '6PM';
    }

    //console.log(subscription)
    const checkAccess = "SELECT u.*, case WHEN g.id!='' then 1 else 0 END as gh FROM users u left join group_change_log g on u.user_id=g.group_head WHERE u.user_id = ? group by u.user_id";
    conn.query(checkAccess, [userID], async (err, user) => {
        if (err) {
            res.send({ message: err })
        } else {
            if (user && user.length > 0) {
                const { name, gh } = user[0];
                if (gh === 0) {
                    const checkAccessinner = "SELECT task.tasklist3 as task_details, task.user_id FROM tasklist task WHERE task.entry_date =" + finaldatenew + " AND task.user_id = ? LIMIT 1 ";
                    console.log(checkAccessinner);
                    conn.query(checkAccessinner, [userID], async (errnew, usertask) => {
                        if (errnew) {
                            res.send({ message: errnew+'-'+currentdatatime+'--'+current_time_in_seconds1+'----' })
                        } else {
                            if (usertask && usertask.length > 0) {
                                if (usertask[0].task_details === null || usertask[0].task_details === "" || usertask[0].task_details === undefined) {
                                    const payload = JSON.stringify({
                                        title: set_title,
                                        body: 'Hello ' + name + ', You did not add the today (' + currdate + ') TaskList @6PM. So Please add your tasklist'
                                    })
                                    webpush.sendNotification(subscription, payload)
                                        .then(result => console.log(result))
                                        .catch(e => console.log(e.stack))

                                    res.status(200).json({ 'success': true })
                                }
                            } else {
                                const payload = JSON.stringify({
                                    title: set_title,
                                    body: 'Hello ' + name + ', You did not add the today (' + currdate + ') TaskList @' + tasktime + '. So Please login and add your tasklist'
                                })
                                webpush.sendNotification(subscription, payload)
                                    .then(result => console.log(result))
                                    .catch(e => console.log(e.stack))

                                res.status(200).json({ 'success': true })
                            }
                        }
                    })
                } else {
                    res.send({ message: "User is Group Head!" })
                }
            } else {
                res.send({ message: "User not registered!" })
            }
        }
    })
}

exports.crongh = async (req, res) => {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // getMonth returns a zero-based index of the month: 0-11
    let day = date.getDate(); // 0 - 31
    if (month < 10) { month = '0' + month }
    if (day < 10) { day = '0' + day }
    const finaldate = year + '-' + month + '-' + day;
    var finaldatenew = "'" + finaldate + "'";
    const db = await connection()
    const ghAllusersQuery = await db.query('select u.user_id, u.name from group_change_log gcl inner join users u on gcl.group_head=u.user_id where end_date is null and gcl.group_head not in(2, 29, 52, 589, 1172, 1508, 1608, 1730, 2063, 2218, 2220, 2248) group by gcl.group_head');
    if (ghAllusersQuery[0] && ghAllusersQuery[0].length > 0) {
        let userTasklist = [];
        let data = new Array();
        await Promise.all(
            ghAllusersQuery[0].map(async (datauser) => {
                var objtask = {}

                const taskdata = await db.query("(select u.user_id, u.name, task.tasklist1, task.tasklist2, task.tasklist3 from group_change_log gcl inner join users u on gcl.user_id=u.user_id left join tasklist task on task.user_id=u.user_id where end_date is null and gcl.group_head= ? and task.entry_date= " + finaldatenew + " group by u.user_id) UNION (select u.user_id, u.name, task.tasklist1, task.tasklist2, task.tasklist3 from group_change_log gcl inner join users u on gcl.user_id=u.user_id left join tasklist task on task.user_id=u.user_id where end_date is null and gcl.group_head= ? and task.entry_date is null group by u.user_id)", [datauser.user_id, datauser.user_id]);
                if (taskdata[0]) {
                    var htmldata = buildHtml(datauser.user_id, datauser.name, taskdata[0]);
                    var mailOptions = {
                        from: 'paribaliyan2013@gmail.com',
                        to: datauser.email_id,
                        // to: 'myfriend@yahoo.com, myotherfriend@yahoo.com',
                        subject: '3 Times Reporting Panel',
                        //text: 'That was easy!'
                        html: htmldata
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + datauser.name);
                            res.send(datauser.name);
                        }
                    });
                }
            })
        )
        //console.log(userTasklist)
        //res.send({ message: "user list fetched", userdatalist: ghAllusersQuery[0], userdata: userdata[0], tasklistdata: userTasklist })
    }
}


function buildHtml(ghid, ghname, subuserdata) {
    //console.log(subuserdata);
    var header = '3 Times Reporting Panel';
    var body = 'Ankit is a honest men';
    var newdata = '';
    var tasklist1data1 = '';
    var tasklist1data2 = '';
    var tasklist1data3 = '';
    // concatenate header string
    // concatenate body string
    subuserdata.map((data) => {
        if (data.tasklist1 !== '' && data.tasklist1 !== null) {
            tasklist1data1 = 'Yes';
        } else {
            tasklist1data1 = 'No';
        }
        if (data.tasklist2 !== '' && data.tasklist2 !== null) {
            tasklist1data2 = 'Yes';
        } else {
            tasklist1data2 = 'No';
        }
        if (data.tasklist3 !== '' && data.tasklist3 !== null) {
            tasklist1data3 = 'Yes';
        } else {
            tasklist1data3 = 'No';
        }
        newdata += '<tr><td style="width:40%">' + data.name + '</td><td style="width:20%">' + tasklist1data1 + '</td><td style="width:20%">' + tasklist1data2 + '</td><td style="width:20%">' + tasklist1data3 + '</td></tr>';
        //console.log(newdata)
    })
    return '<!DOCTYPE html>'
        + '<html><head></head><body><table border="1" width="100%"><tr><td colspan="4" style="text-align:center;">' + ghname + '</td></tr><tr><td>Team Members</td><td>12 PM</td><td>3 PM</td><td>6 PM</td></tr>' + newdata + '</table></body></html>';

};