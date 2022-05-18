const admin = require('../../utils/init.js')
const {Random} = require('random-js')

const fetchUserByEmail = async (email)=>{

    const db = admin.firestore()

    try {

        const ref = db.collection("customers/users/list")
        const res = await ref.where("email", "==", email).get()
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

        const random = new Random()
        const db = admin.firestore()

        const account_number = random.integer(100000000000,999999999999) //generates random 12digit numbers
        payload.account_number = account_number


        await db.doc(`customers/users/list/${payload.email}`).set(payload)
        delete payload.password
        
        return payload
        
    } catch (error) {
        throw error
    }
    
}

const setIsUserSignedIn= async (email)=>{

    try {

        const db = admin.firestore()

        await db.doc(`customers/users/list/${email}`).set({last_login: new Date(), signed_in: true}, {merge:true})
        return
        
    } catch (error) {
        throw error
    }
    
}

const signout = async(email)=>{

    try {

        const db = admin.firestore()
        
        await db.doc(`customers/users/list/${email}`).set({last_login: new Date(), signed_in: false}, {merge:true})
        return
        
    } catch (error) {
        throw error
    }
    
}

const subtractFromAccBalance = async (user_email, amount)=>{

    try {

        const db =admin.firestore()
        
        const user = await fetchUserByEmail(user_email)

        await db.doc(`customers/users/list/${user_email}`).update({
            "account_details.balance": user.account_details.balance - amount
        })

        return
        
    } catch (error) {
        throw error
    }
    
}


const addToAccBalance = async (user_email, amount)=>{

    try {

        const db =admin.firestore()
        
        const user = await fetchUserByEmail(user_email)

        await db.doc(`customers/users/list/${user_email}`).update({
            "account_details.balance": user.account_details.balance + amount
        })

        return
        
    } catch (error) {
        throw error
    }
    
}



module.exports = {
    addToAccBalance,
    fetchUserByEmail,
    setIsUserSignedIn,
    signout,
    registerUser,
    subtractFromAccBalance
}