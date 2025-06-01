const express = require('express')
const methodOverride = require('method-override')
const multer  = require('multer')
const flash = require('express-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config()

const database = require("./config/database")

const systemConfig = require("./config/systems")

const routeAdmin = require("./routes/admin/index.route")
const route = require("./routes/client/index.route")

database.connect()

const app = express()
const port = process.env.PORT

app.use(methodOverride('_method'))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('views', './views')
app.set('view engine', 'pug')

// App Locals Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin

app.use(express.static('public'))

app.use('/uploads', express.static('uploads'))

// Flash
app.use(cookieParser('JKSLSF'));
app.use(session({
  secret: 'JKSLSF',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
routeAdmin(app)
route(app)


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})