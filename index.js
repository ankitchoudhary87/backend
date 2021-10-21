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
app.use(cors())
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
// Routes
const user = require('./routes/user')
app.use('/user',user);
//Routes
app.get('/setcookie', (req, res) => {
    res.cookie('Cookie token name','encrypted cookie string Value');
    res.send('Cookie have been saved successfully');
});
app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})