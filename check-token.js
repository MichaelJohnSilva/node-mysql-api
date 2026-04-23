const jwt = require('jsonwebtoken');
const config = require('./config.json');

// Paste the token you got from authenticate here:
const token = 'PASTE_YOUR_TOKEN_HERE';

try {
    const decoded = jwt.verify(token, config.secret);
    console.log('Token is valid. Decoded:', decoded);
} catch (err) {
    console.error('Token invalid:', err.message);
}
