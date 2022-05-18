const customer_auth = require('./services/app/auth/customer.auth')
const ecommerce_auth = require('./services/app/auth/ecommerce.auth')
const bank_auth = require('./services/app/auth/bank.auth.js')
const transaction = require("./services/app/Transactions.js")
// const ecommerce = require("./services/app/ECommerce")
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.customer_auth = customer_auth
// exports.ecommerce = ecommerce
exports.ecommerce_auth = ecommerce_auth
exports.bank_auth = bank_auth
exports.transaction = transaction
