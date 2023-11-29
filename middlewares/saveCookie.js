const admin = require('firebase-admin');

const saveCookie = (token, res) => {
	// Generete cookie session
	const expiresIn = 60 * 60 * 24 * 5 * 1000;

	//create session with token
	admin
		.auth()
		.createSessionCookie(token, { expiresIn })
		.then(
			(cookieData) => {
				const options = { maxAge: expiresIn, httpOnly: true, secure: true };
				//send cookie in response
				res.cookie('session', cookieData, options);

				//redirect user to success route with uid parameter
				admin
					.auth()
					.verifyIdToken(token)
					.then((decodedToken) => {
						const uid = decodedToken.uid;
						res.redirect(`/user/${uid}`);
					})
					.catch((error) => {
						console.error('Error verifying ID token:', error);
						res.status(401).send('Unauthorized Request');
					});
			},
			(error) => {
				console.error(error);
				res.status(401).send('Unauthorized Request');
			}
		);
};

module.exports = saveCookie;
