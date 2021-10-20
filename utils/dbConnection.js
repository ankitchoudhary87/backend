const mysql = require('mysql');
const env = require('dotenv');
env.config();
const conn = mysql.createConnection({
    host: `${process.env.HOSTNAME}`, // assign your host name
    user: `${process.env.DB_USERNAME}`,      //  assign your database username
    password: `${process.env.USER_PASSWORD}`,      // assign your database password
    database: `${process.env.DATABASE}`, // assign database Name
    port: 3306
});
conn.connect( (err) => {
    if (err) throw err;
    console.log('Database is connected successfully !');
});
module.exports = conn;