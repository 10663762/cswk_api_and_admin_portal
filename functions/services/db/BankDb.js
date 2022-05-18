const admin = require('../../utils/init.js')

const fetchUsers = async()=>{

    const db = admin.firestore()
    const _users = []
    
    try {
        const ref = db.collection("customers/users/list")

        const users = await ref.get()

        users.forEach((user)=>{
            delete user.data().password
            _users.push(user.data())
        })

        return _users
        
    } catch (error) {
        throw error
    }
    
}

const fetchUserByEmail = async (email)=>{

    const db = admin.firestore()

    try {

        const ref = db.collection("bank/users/list")
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

        const db = admin.firestore()

        const user = await fetchUserByEmail(payload.email)

        if(user !== null) throw new Error("User with the same email already exists")

        await db.doc(`bank/users/list/${payload.email}`).set(payload)
        return
        
    } catch (error) {
        throw error
    }
    
}

const setIsUserSignedIn= async (email)=>{

    try {

        const db = admin.firestore()

        await db.doc(`bank/users/list/${email}`).set({last_login: new Date(), signed_in: true}, {merge:true})
        return
        
    } catch (error) {
        throw error
    }
    
}

const signout = async(email)=>{

    try {

        const db = admin.firestore()
        
        await db.doc(`bank/users/list/${email}`).set({last_login: new Date(), signed_in: false}, {merge:true})
        return
        
    } catch (error) {
        throw error
    }
    
}



const subtractFromAccBalance = async (user_email, amount)=>{

    try {

        const db =admin.firestore()
        
        const user = await fetchUserByEmail(user_email)

        await db.doc(`bank/users/list/${user_email}`).update({
            "account_details.balance": user.account_details.balance - amount
        })

        return
        
    } catch (error) {
        throw error
    }
    
}



module.exports = {
    fetchUsers,
    fetchUserByEmail,
    setIsUserSignedIn,
    signout,
    registerUser,
    subtractFromAccBalance
}