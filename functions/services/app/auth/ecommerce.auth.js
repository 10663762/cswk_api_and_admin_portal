/**
 * *These are all the APIs responsible for creating and authorizing the bank admin
 */

const express = require("express")
const firebase_functions = require("firebase-functions")
const cors = require('cors')
const jwt = require('jsonwebtoken')

const {validateLogin, validateLogout, validateRegistrationPayload, validateEcommerceRegistrationPayload, validateEcommerceLoginPayload} = require("../../../models/schema")
const ecommerceDb = require('../../db/EcommerceDb')
const crypto = require("../../../utils/crypto.js")
const date = require("../../../utils/date.js")


const app = express()   //new instance of http server
const logger = firebase_functions.logger
const token_secret = firebase_functions.config().auth.token_secret //environment variable

app.use(cors({origin: true}))   //enables crossorigin resource sharing. without this calls from client to this api will fail
app.use(express.json())     //middleware: converts incoming JSON file to regular javascript object
app.use(express.urlencoded({extended: false}))  //parses urlencoded payload 


app.post('/signin', async (req, res)=>{

    try {

        
        //get payload sent by client
        const loginPayload = req.body

        console.log(loginPayload)

        //validate payload
        const loginPayloadVerification = validateEcommerceLoginPayload(loginPayload)
        logger.log('info', loginPayloadVerification)

        if(loginPayloadVerification.error){

            logger.error("failed to validate user payload", "\n", loginPayloadVerification.error.message)

            return res.status(400).json({
                message: loginPayloadVerification.error.message
            })
            
        }
        logger.info("validation successful")

        //fetch user
        const shop = await ecommerceDb.fetchShopByName(loginPayload.shop_name, )
        logger.info("fetched shop successfully")
        
        if(shop === null){
            //if no user is found with provided credentials return error message to client
            logger.info("shop doesn't exist. returning error code")
            return res.status(400).json({
                message: "invalid shop name or password"
            })
        }

        //if user is found compare the password from client to password from db
        logger.info("validating user password....")
        const compareResult = await crypto.compare(shop.password, loginPayload.password)

        //if match
        if(compareResult === "match"){

            //set last login time
            ecommerceDb.setIsShopSignedIn(shop.shop_name)

            //generate token for authentication and authorization
            const token = jwt.sign(loginPayload, token_secret, {
                expiresIn: 86400
            })

            //remove shop's password from object to be sent to client
            delete shop.password
            
            //send http status 200(ok) to client to 
            return res.status(200).json({
                message: "login successful",    //response message
                user: shop,       //user object
                token: {    //access token
                    value: token,
                    expires_at: date.getDateDaysFromNow(1)
                }
            })

        }

        //if passwords don't match send http status 400(client side error) to client with a responsed message
        return res.status(400).json({
            message: "invalid shop name or password"     //response message
        })


        
    } catch (error) {

        console.log(error)

        //If an unexpected error occurred during execution
        //Send http status 500 (internal server error) to client with an error message
        res.status(500).json({
            message: "an error occurred on the server during execution"     //error message
        })
        
    }
    
})

app.post('/register', async (req, res)=>{

    try {

        const registrationPayload = req.body
        console.log(registrationPayload)
        const validationResponse = validateEcommerceRegistrationPayload(registrationPayload)


        if(validationResponse.error){
            logger.log('info', validationResponse)

            return res.status(400).json({
                message: validationResponse.error.message
            })
            
        }

        registrationPayload.password = await crypto.genHash(registrationPayload.password)
        const registeredUser = await ecommerceDb.registerUser({
            ...registrationPayload,
            last_seen: new Date().getTime(),
            signed_in: true
        })
        

        const token = jwt.sign(registeredUser, token_secret, {
            expiresIn: 86400
        })

        res.status(200).json({
            message: "registration successful",
            user:{
                ...registeredUser,
                last_seen: new Date().getTime()
            },
            token: {
                value: token,
                expires_at: date.getDateDaysFromNow(1)
            }
        })
        

        
    } catch (error) {
        logger.error(error)
        res.status(500).json({
            message: "an error occurred on the server during execution"
        })
    }
    
})


app.post("/signout", async(req, res)=>{

    try {

        logger.info("***signing out*****")

        const token = req.headers['x-access-token']
        const logoutPayload = req.body

        if(!token) { 

            logger.error("no token provided")
            return res.status(400).json({message: "please provide authentication token in your request header"})

        }


        try {

            const decode = jwt.verify(token, token_secret)
            
            const validateLogoutResponse = validateLogout(logoutPayload)

            if(validateLogoutResponse.error){

                logger.error("failed to validate payload: ", validateLogoutResponse.error.message)
                return res.status(400).json({
                    message: validateLogoutResponse.error.message
                })
                
            }else{

                await ecommerceDb.signout(logoutPayload.email)
                return res.status(200).json({
                    message: "User signed out successfully"
                })

            }

            
        } catch (error) {
            return res.status(500).json({message: "token authentication failed"})
        }
        
    } catch (error) {

        logger.error(error)
        res.status(500).json({
            message: "an error occurred on the server during execution"
        })
        
    }
    
})

const ecommerce_auth = firebase_functions.https.onRequest(app)

module.exports = ecommerce_auth