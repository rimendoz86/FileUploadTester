var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer')
const upload = multer()
const basicAuth = require('express-basic-auth')

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(basicAuth({
    users: {'user1':"pass1"}
}))
app.use('/', indexRouter);

app.post('/file', upload.any(), async (req, res) => {
    res.send(JSON.stringify({
        ReceivedUTCTime: new Date().toJSON()
    }));
});

module.exports = app;
