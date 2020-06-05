const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const expressFileupload  = require('express-fileupload');
const session = require('express-session');

var app = express();
const PORT = process.env.PORT || 3000;
global.rootURL = "";

/***************** Neo4j DB configuration *****************/
var db = require('./config/db');

/******************* Express App Setup ********************/
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(expressFileupload());
app.use(session({
    secret: 'kupk07',
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {secure: false}
}));

/******************* View Engine Setup ********************/
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'app', 'views'));
app.set('view engine', 'ejs');

/************************* Routes *************************/
var router = require('./config/routes/routes');
app.use(router);

app.listen(PORT, () => console.log(`App is listening on port ${PORT}!`));