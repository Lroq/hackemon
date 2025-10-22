const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username : { type: String, required: true },
    hashpassword: { type: String, required: true },
    // resetToken: { type: String, default: null },
    // resetTokenExpiry: { type: Date, default: null }
});

module.exports = mongoose.model('User', UserSchema);
