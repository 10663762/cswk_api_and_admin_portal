const admin = require('../../utils/init.js')


const fetchShopByName = async (shop_name)=>{

    const db = admin.firestore()

    try {

        const ref = db.collection("e_commerce/users/list")
        const res = await ref.where("shop_name", "==", shop_name).get()
        const user = res.docs[0]
        
        if(!user) return null
        
        if(user.exists){
            return user.data()
        }

        
    } catch (error) {
        throw error
    }
    
}


const registerUser = async (payload)=>{

    try {

        const db = admin.firestore()

        await db.doc(`e_commerce/users/list/${payload.shop_name}`).set(payload)
        delete payload.password
        
        return payload
        
    } catch (error) {
        throw error
    }
    
}

const setIsShopSignedIn= async (shop_name)=>{

    console.log("in set bla bla", shop_name)

    try {

        const db = admin.firestore()

        await db.doc(`e_commerce/users/list/${shop_name}`)
            .set({last_login: new Date(), signed_in: true}, {merge:true})
        return
        
    } catch (error) {
        throw error
    }
    
}

const signout = async(shop_name)=>{

    try {

        const db = admin.firestore()
        
        await db.doc(`e_commerce/users/list/${shop_name}`).set({last_login: new Date(), signed_in: false}, {merge:true})
        return
        
    } catch (error) {
        throw error
    }
    
}

module.exports = {
    fetchShopByName,
    registerUser,
    setIsShopSignedIn,
    signout
}