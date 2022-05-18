/**
 * *These are all the APIs responsible for all transactions in the system
 */

//Importing all necessary files
const express = require("express")
const firebase_functions = require("firebase-functions")
const cors = require("cors")
const jwt = require("jsonwebtoken")

const {validateTransferPayload, validatePaymentPayload, validateGetPaymentsPayload, validateRefundPaymentPayload, validateGetRefundsPayload} = require("../../models/schema.js")
const transactionDb = require("../db/TransactionDb.js")
const CustomerDb = require("../db/CustomerDb")
const BankDb = require("../db/BankDb")
const crypto = require("../../utils/crypto")
const twilioClient = require("twilio")(twilio_account_sid, twilio_auth_token)


const app = express()   //new instance of http server
const token_secret = firebase_functions.config().auth.token_secret  //environment variable
const twilio_auth_token = firebase_functions.config().twilio.auth_token //environment variable
const twilio_account_sid = firebase_functions.config().twilio.account_sid   //environment variable
const twilio_phone_number = firebase_functions.config().twilio.phone_number //environment variable


app.use(cors({origin:true}))    //enables crossorigin resource sharing. without this calls from client to this api will fail
app.use(express.json())     //enables crossorigin resource sharing. without this calls from client to this api will fail
app.use(express.urlencoded({extended: false}))  //parses urlencoded payload


//API endpoint used by admin account to transfer money
app.post("/transfer-money", async (req, res)=>{

    try {

        //Get access token from request header
        const token = req.headers['x-access-token']

        // if no token send an http status code 400 (client side error) to client
        // along with a message
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {
            // if token is present verify the token
            const decode = jwt.verify(token, token_secret)
            
        } catch (error) {
            // if validation fails end an http status code 400 (client side error) to client
            return res.status(400).json({message: "Token authentication failed"})
        }

        //get transaction payload sent by client
        const transactionPayload = req.body
        
        //validate payload
        const validationResult = validateTransferPayload(transactionPayload)

        // if validation of tansaction payload from client fails
        if(validationResult.error){
            
            // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: validationResult.error.message
            })
        }

        // if validation is successful, record transaction in database
        const paymentRes = await transactionDb.recordTransfer(transactionPayload)

        //send alert message to payee
        await twilioClient.messages.create({
            body: `Dear ${transactionPayload.payee_name}, This is to inform you that you have received an amount of GH₵ ${transactionPayload.amount} in your account.`,
            from: twilio_phone_number,
            to: transactionPayload.payee_phone
        })

        //send http status code 200(ok) to client
        // noting a successful transaction
        res.status(200).json({
            message: "Payment made successfully",
            meta_data:{
                id: paymentRes,
                ...transactionPayload
            }
        })


        
        
    } catch (error) {

        if(error.code === 21608) return res.status(500).json({
            message: "Unverified phone number."
        })

        // return http status code 500 (server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }

})


//API endpoint used by e-commerce to make payment to a bank customer
app.post("/make-payment", async (req, res)=>{

    try {

        //Get access token from request header
        const token = req.headers['x-access-token']

        // if no token send an http status code 400 (client side error) to client
        // along with a message
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {

            // if token is present verify the token
            const decode = jwt.verify(token, token_secret)
            
        } catch (error) {
            // if validation fails end an http status code 400 (client side error) to client
            return res.status(400).json({message: "Token authentication failed"})
        }

        //get transaction payload sent by client
        const transactionPayload = req.body

        //validate payload
        const validationResult = validatePaymentPayload(transactionPayload)

        // if validation of tansaction payload from client fails
        if(validationResult.error){

            // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: validationResult.error.message
            })
        }

        // if validation is successful, record transaction in database
        await transactionDb.recordPayment(transactionPayload)
        
        //send http status code 200(ok) to client
        // noting a successful transaction
        res.status(200).json({
            message: "Payment made successfully"
        })
        
    } catch (error) {
        
        // return http status code 500 (server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }
    
})

//API endpoint used by bank customers to retrieve payments made to their accounts
app.post("/get-payments", async(req, res)=>{

    try {

        //Get access token from request header
        const token = req.headers['x-access-token']

        // if no token send an http status code 400 (client side error) to client
        // along with a message
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {

             // if token is present verify the token
             const decode = jwt.verify(token, token_secret)
            
        } catch (error) {
            // if validation fails end an http status code 400 (client side error) to client
            return res.status(400).json({message: "Token authentication failed"})
        }

        //get transaction payload sent by client
        const transactionPayload = req.body
        
        //validate payload
        const validationResult = validateGetPaymentsPayload(transactionPayload)

        // if validation of tansaction payload from client fails
        if(validationResult.error){

            // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: validationResult.error.message
            })
        }

        // if validation is successful, record transaction in database
        const payments = await transactionDb.getPayments(transactionPayload.account_number)
        
        //send http status code 200(ok) to client
        // noting a successful transaction
        res.status(200).json({
            message: "Payments retrieved successfully",
            data: payments
        })
        
        
    } catch (error) {
        
        // return http status code 500 (server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }

})

//API endpoint used by bank customers to refund payments made to their accounts
app.post("/refund-payment", async(req, res)=>{


    try {

        //Get access token from request header
        const token = req.headers['x-access-token']

        // if no token send an http status code 400 (client side error) to client
        // along with a message
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {

             // if token is present verify the token
             const decode = jwt.verify(token, token_secret)
            
        } catch (error) {
            // if validation fails end an http status code 400 (client side error) to client
            return res.status(400).json({message: "Token authentication failed"})
        }

        //get transaction payload sent by client
        const transactionPayload = req.body

        //validate payload
        const validationResult = validateRefundPaymentPayload(transactionPayload)

        // if validation of tansaction payload from client fails
        if(validationResult.error){

            // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: validationResult.error.message
            })
        }

        // if validation is successful
        const user = await CustomerDb.fetchUserByEmail(transactionPayload.email)
        if(crypto.compare(user.password, transactionPayload.password)==="clash"){
            return res.status(400).json({
                message: "Failed to refund payment, invalid password"
            })
        }

        // record payment reversal
        await transactionDb.revertPayment(transactionPayload.payment_id)
        
        //send http status code 200(ok) to client
        // noting a successful transaction
        res.status(200).json({
            message: `Payment refunded successfully`,
        })
        
        
    } catch (error) {

        // return http status code 500 (server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }

})

//API endpoint used by bank customers to get refunds
app.post("/get-refunds", async(req, res)=>{

    try {

        //Get access token from request header
        const token = req.headers['x-access-token']
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {

            const decode = jwt.verify(token, token_secret)
            console.log(decode);
            
        } catch (error) {
            return res.status(400).json({message: "Token authentication failed"})
        }

        const transactionPayload = req.body
        console.log("challeeeeee")
        const validationResult = validateGetRefundsPayload(transactionPayload)

        if(validationResult.error){
            return res.status(400).json({
                message: validationResult.error.message
            })
        }

        const payments = await transactionDb.getRefunds(transactionPayload.account_number)
        
        return res.status(200).json({
            message: "Refunds retrieved successfully",
            data: payments
        })
        
        
    } catch (error) {
        
        if(error.code === 21608) return res.status(500).json({
            message: "Unverified phone number."
        })

        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }

})

app.get("/get-transactions", async(req, res)=>{

    try {

        const token = req.headers["x-access-token"]
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {

            const decode = jwt.verify(token, token_secret)
            console.log(decode);
            
        } catch (error) {
            return res.status(400).json({message: "Token authentication failed"})
        }

        const transactions = await transactionDb.getAllTransactions()

        return res.status(200).json({
            message: "Transactions retrieved successfully",
            data: transactions
        })




        
    } catch (error) {

        console.log(error)
        
        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }
    
})

app.get("/get-users", async(req, res)=>{

    try {

        const token = req.headers['x-access-token']
        if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        try {

            const decode = jwt.verify(token, token_secret)
            
        } catch (error) {
            return res.status(400).json({message: "Token authentication failed"})
        }


        const users = await BankDb.fetchUsers()
        
        return res.status(200).json({
            message: "Refunds retrieved successfully",
            data: users
        })
        
        
    } catch (error) {

        return res.status(500).json({
            message: "An error occurred on the server during execution"
        })
    }

})


const transactions = firebase_functions.https.onRequest(app)
module.exports = transactions