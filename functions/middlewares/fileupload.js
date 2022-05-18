const Busboy = require("busboy")
const os = require("os")
const path = require("path")
const fs = require("fs")

/**
 * *This middleware is responsible for processing multi-part form data 
 */

const fileUpload = (req, res, next)=>{

    try {

        console.log("in middleware")
        console.log(req.body)

        if(req.method !== "POST") return res.status(405)

        const busboy = Busboy({headers: req.headers})
        const tmpdir = os.tmpdir

        const fields = {}
        const uploads = {}
        const fileWrites = []

        // process each non-file field in the form
        busboy.on("field", (fieldname, value)=>{
            fields[fieldname] = value
            console.log(fields)
        })

        //process each file available in the form data
        busboy.on("file", (fieldName, file, fileInfo)=>{

            console.log("file detected")

            const filePath = path.join(tmpdir, fileInfo.filename)
            uploads[fieldName] = filePath

            console.log(fieldName)

            const writeStream = fs.createWriteStream(filePath)
            file.pipe(writeStream)

            const promise = new Promise((res, rej)=>{
                file.on("end", ()=>{
                    writeStream.end()
                })
                writeStream.on("finish", res)
                writeStream.on('err', rej)
            })

            fileWrites.push(promise)

        })

        busboy.on("finish", async()=>{
            try {
                await Promise.all(fileWrites)
                next()
            } catch (error) {
                return res.status(500)
                    .json({
                        message: "error occured during execution"
                    })
            }
        })

        console.log("damn shit didn't trigger. throwing an error")
        throw new Error("Shit is not working")
        
    } catch (error) {
        return res.status(500)
            .json({
                message: error.message
            })
    }

    
}

module.exports = fileUpload