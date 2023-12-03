const express = require('express');
const expressLayout = require('express-ejs-layouts');

const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const admin = require('firebase-admin');
const serviceAccountKey = require('./serviceAccountKey.json');

// middleware user
const checkAuthUser = require('./middlewares/checkAuthUser');
const saveCookie = require('./middlewares/saveCookie');
const saveDataUser = require('./middlewares/saveDataUser');

// get env data
require('dotenv').config();

// create connection to mongodb
require('./model-db/db');

// get model-db
const User = require('./model-db/model');

const app = express();
const port = process.env.PORT || 8080;

// setup method override
app.use(methodOverride('_method'));

// use ejs layout
app.set('view engine', 'ejs');
app.use(expressLayout);

// Built-in Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// konfigurasi flash
app.use(cookieParser('secret'));
app.use(
	session({
		cookie: { maxAge: 6000 },
		secret: 'secret',
		resave: true,
		saveUninitialized: true,
	})
);
app.use(flash());

//initializing firebase setup
admin.initializeApp({
	credential: admin.credential.cert(serviceAccountKey),
});

app.get('/', (req, res) => {
	// call file view automatically and must change direktory to template engine used (ejs)
	res.render('login', {
		layout: 'layouts/main-layout',
		title: 'Home Page',
		msg: req.flash('msg'),
	});
});

// User page and add user to mongodb
app.get('/user/:uid', checkAuthUser, saveDataUser, async (req, res) => {
	const users = await User.find();
	res.render('data-user', {
		layout: 'layouts/main-layout',
		title: 'User',
		users,
		msg: req.flash('msg'),
	});
});


// User edit data
app.get('/user/:uid/edit', async (req, res) => {
	const user = await User.findOne({ uid: req.params.uid });

	res.render('edit-user', {
		title: 'Form edit data user',
		layout: 'layouts/main-layout',
		user,
	});
});

// process edit data
app.put(
	'/user/:uid',
	[
		body('name').custom(async (value, { req }) => {
			const duplicate = await User.findOne({ name: value });
			if (value !== req.body.oldName && duplicate) {
				throw new Error('Nama telah digunakan');
			}
			return true;
		}),
		check('email', 'Email tidak valid').isEmail(),
	],
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.render('edit-user', {
				title: 'Form ubah data user',
				layout: 'layouts/main-layout',
				errors: errors.array(),
				user: req.body,
			});
		} else {
			User.updateOne(
				{ _id: req.body._id },
				{
					$set: {
						name: req.body.name,
						email: req.body.email,
						data: {
							height: req.body.height,
							weight: req.body.weight,
						},
					},
				}
			).then((result) => {
				req.flash('msg', 'Data user berhasil diubah');
				res.redirect('/user/:uid');
			});
		}
	}
);

// detail page user
app.get('/user/:uid/detail', async (req, res) => {
	const user = await User.findOne({ uid: req.params.uid });
	res.render('detail', {
		layout: 'layouts/main-layout',
		title: 'Detail User Page',
		user,
	});
});

//saving firebase token in cookies
app.get('/savecookie', (req, res) => {
	const Idtoken = req.query.id;
	saveCookie(Idtoken, res);
});

app.listen(port, () => {
	console.log(`app listening on port ${port}`);
});
