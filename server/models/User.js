const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    UUID: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    hashpassword: { type: String, required: true },
    level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
