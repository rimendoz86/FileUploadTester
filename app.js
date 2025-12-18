var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer')
const upload = multer()
const basicAuth = require('express-basic-auth')
const appSettings = require('./appConfig.json');

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(basicAuth({
    users: {[appSettings.user]:appSettings.pass}
}))
app.use('/', indexRouter);

app.post('/file', upload.any(), async (req, res) => {
    res.send(JSON.stringify({
        ReceivedUTCTime: new Date().toJSON(),
        FileSize: req.files[0].size
    }));
});

module.exports = app;
