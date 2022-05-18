const admin = require('firebase-admin')
const saKey = require("../saKey.json")


const fbInstance =admin.initializeApp({
    credential: admin.credential.cert(saKey),
    storageBucket: 'cswk-payment-platform.appspot.com'
})

module.exports = admin
exports.fbInstance = fbInstance