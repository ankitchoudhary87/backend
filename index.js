const express = require('express')
const cors = require('cors')
const connectDB = require('./utils/dbConnection')
const env = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// environment variable or you can say constants
env.config();
const app = express();
app.use(express.json())
app.use(express.urlencoded())
app.use(cors({ origin: 'https://whosin-frontend.herokuapp.com', credentials: true}));
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
// Routes
const user = require('./routes/user')
app.use('/user',user);
//Routes
app.post('/setcook', (req, res) => {
    res.cookie('nameOfuserid', "Ankit Baliyan", { expiresIn: "1d", httpOnly: true })
    res.send('Cookie Set Successfully');
})
app.post('/getcook', (req, res) => {
    var cookname = req.cookies.nameOfuserid;
    res.send(`Cookies Value is: ${cookname}`);
})
app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})