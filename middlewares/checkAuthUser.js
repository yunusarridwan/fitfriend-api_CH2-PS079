const admin = require('firebase-admin');

//check auth
const checkAuthUser = (req, res, next) => {
	//get cookie
	const sessionCookie = req.cookies.session || '';
	//save user in req.user
	admin
		.auth()
		.verifySessionCookie(sessionCookie)
		.then((userData) => {
			req.user = userData;
			next();
		})
		.catch((error) => {
			res.redirect('/');
		});
};

module.exports = checkAuthUser;
