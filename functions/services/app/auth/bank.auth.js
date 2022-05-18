/**
 * *These are all the APIs responsible for creating and authorizing the bank admin
 */

//Importing all necessary files
const express = require("express")  
const firebase_functions = require("firebase-functions")
const cors = require('cors')
const jwt = require('jsonwebtoken')

const {validateLogin, validateLogout, validateRegistrationPayload} = require("../../../models/schema")
const bankDb = require('../../db/BankDb.js')
const crypto = require("../../../utils/crypto.js")
const date = require("../../../utils/date.js")


const app = express()   //new instance of http server
const token_secret = firebase_functions.config().auth.token_secret //environment variable

app.use(cors({origin: true}))   //enables crossorigin resource sharing. without this calls from client to this api will fail
app.use(express.json())     //middleware: converts incoming JSON file to regular javascript object
app.use(express.urlencoded({extended: false}))  //parses urlencoded payload

// Sign in API
app.post('/signin', async (req, res)=>{

    try {

        
        //get payload sent by client
        const loginPayload = req.body

        //validate payload
        const loginPayloadVerification = validateLogin(loginPayload)

        // if validation of payload from client fails
        if(loginPayloadVerification.error){


            // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: loginPayloadVerification.error.message
            })
            
        }

        //else fetch user with provided email
        const user = await bankDb.fetchUserByEmail(loginPayload.email)
        
        if(user === null){
            //if no user is found with provided credentials return error message to client
            return res.status(400).json({
                message: "invalid username or password"
            })
        }

        //if user is found compare the password from client to password from db
        const compareResult = await crypto.compare(user.password, loginPayload.password)

        //if match
        if(compareResult === "match"){


            //set last login time
            bankDb.setIsUserSignedIn(user.email)

            //generate token for authentication and authorization
            const token = jwt.sign(loginPayload, token_secret, {
                expiresIn: 86400 //token expires in 24hours
            })

            // delete hashed password from user object before sending to client side
            delete user.password
            
            //return success message with token and user object
            return res.status(200).json({
                message: "login successful",
                user,
                token: {
                    value: token,
                    expires_at: date.getDateDaysFromNow(1)
                }
            })

        }

        // else if passwords do not match return an error message
        return res.status(400).json({
            message: "invalid username or password"
        })


        
    } catch (error) {

        // return http status code 500 (server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        res.status(500).json({
            message: "an error occurred on the server during execution"
        })
        
    }
    
})

// Registration api (Registers new bank admin)
app.post('/register', async (req, res)=>{

    try {

        //get payload sent by client
        const registrationPayload = req.body

        //validate payload
        const validationResponse = validateRegistrationPayload(registrationPayload)


        // if validation of payload from client fails (invalid payload)
        if(validationResponse.error){

             // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: validationResponse.error.message
            })
            
        }

        //else hash the users password
        registrationPayload.password = await crypto.genHash(registrationPayload.password)

        // store the users credentials in the database
        await bankDb.registerUser({
            ...registrationPayload,
            account_details:{
                balance: 200000
            },
            last_seen: new Date().getTime(),
            signed_in: true
        })
        
        // delete hashed password from user object before sending to client side
        delete registrationPayload.password

         //generate token for authentication and authorization
        const token = jwt.sign(registrationPayload, token_secret, {
            expiresIn: 86400
        })

        //return success message with token and user object
        res.status(200).json({
            message: "registration successful",
            user:{
                ...registrationPayload,
                account_details:{
                    balance: 200000
                },
                last_seen: new Date().getTime()
            },
            token: {
                value: token,
                expires_at: date.getDateDaysFromNow(1)
            }
        })
        

        
    } catch (error) {

        // if the user provided an email which is already in use
        if(error.message === "User with the same email already exists"){
            // http status code 400 (client side error) to client saying an 
            // account already exists with the email provided by the client
            return res.status(400).json({
                message: "An account with the same email already exists"
            })
        }

        // else whatever error occurs
        // return http status code 500 (internal server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        res.status(500).json({
            message: "an error occurred on the server during execution"
        })
    }
    
})

// Sign out api (Records sign out activity)
app.post("/signout", async(req, res)=>{

    try {

        // check request header for access token
        const token = req.headers['x-access-token']

        //get payload sent by client
        const logoutPayload = req.body

        // if no access token was provided by the client
        if(!token) { 

             // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({message: "please provide authentication token in your request header"})

        }

        // if token was provided by client
        try {

            // verify the token
            const decode = jwt.verify(token, token_secret)
            
        } catch (error) {
            // if an error occurs during verification send http status code 500 (internal server error) to client
            return res.status(500).json({message: "token authentication failed"})
        }

        
        //After token authentication
        // validate logout payload
        const validateLogoutResponse = validateLogout(logoutPayload)

         // if validation of payload from client fails (invalid payload)
        if(validateLogoutResponse.error){

            // send http status code 400 (client side error) to client
            // along with an error message 
            return res.status(400).json({
                message: validateLogoutResponse.error.message
            })
            
        }else{

            // else record signout activity in database
            await bankDb.signout(logoutPayload.email)
            return res.status(200).json({
                message: "User signed out successfully"
            })

        }
        
    } catch (error) {

        // whatever error occurs
        // return http status code 500 (internal server side error) to clientInformation, 
        // saying an unexpected error occurred during execution
        
        res.status(500).json({
            message: "an error occurred on the server during execution"
        })
        
    }
    
})



const bank_auth = firebase_functions.https.onRequest(app)
// export apis
module.exports = bank_auth