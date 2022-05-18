
const express = require("express")
const cors = require("cors")
const uploadMiddleWare = require("express-fileupload")
const jwt = require("jsonwebtoken")
const appRoot = require('app-root-path')
const path = require("path")
const {Storage} = require("@google-cloud/storage")
const {format} = require("util")

const app = express()

app.use(cors({origin: true}))
app.use(express.urlencoded({extended:false}))
app.use(uploadMiddleWare({
    safeFileNames: true,
    preserveExtension: true,
    // createParentPath: true
}))
app.use("/products",express.static(path.join(appRoot.path, "functions", "products")))




app.post("/add_product", (req, res)=>{


    try {

        const storage = new Storage({
            keyFilename:  path.join(appRoot.path, "functions", "saKey.json"),
            projectId: "cswk-payment-platform"
        })

        storage.getBuckets()
        .then(x=>console.log(x))

        return res.send()

        // const token = req.headers['x-access-token']

        // if(!token) return res.status(400).json({message: "Please provide authentication token in your request header"})

        // try {

        //     const decode = jwt.verify(token, "eJ1gC5q2zs")
        //     console.log(decode);
            
        // } catch (error) {
        //     return res.status(400).json({message: "Token authentication failed"})
        // }

        if(req.files){


            const product_img = req.files.product_img


            const bucket = storage.bucket("products")
            const blob = bucket.file(product_img)
            const blobStream = blob.createWriteStream()

            blobStream.on("error", ()=>{
                res.status(500)
                .json({
                    message:"an error occurred"
                })
            })


            blobStream.on("finish", ()=>{

                console.log("done")
                
                const publicUrl = format(
                    `https://storage.googleapis.com/${bucket.name}/${blob.name}`
                )
                res.status(200)
                .json({
                    message:"server successfully saved file",
                    uri: publicUrl
                })
            })

            // product_img.mv(`${appRoot}/functions/products/${file_name}`, (err)=>{
            //     if(err){
            //         res.status(404)
            //         .json({
            //             message: err
            //         })
            //     }else{
                    
            //     }
            // })
            
        }else{
            res.status(404)
                .json({
                    message:"no file detected in response object"
                })
        }
        
    } catch (error) {

        res.status(500)
        .json({
            message:error.message
        })
    }
    
})


app.listen(6050)