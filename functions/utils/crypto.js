const bcrypt = require('bcrypt')

const genHash = async(data)=>{

    try {
        
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(data, salt)

        return hash
        
    } catch (error) {
        throw error
    }
    
}

const compare = async (hashed, raw)=>{

    try {

        const res = await bcrypt.compare(raw, hashed)
        return res === true ? 'match' : 'clash'
        
    } catch (error) {
        throw error
    }
    
}

module.exports = {
    genHash,
    compare
}