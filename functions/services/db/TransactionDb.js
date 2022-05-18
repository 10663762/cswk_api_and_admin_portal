const admin = require('../../utils/init.js')
const customerDb = require('./CustomerDb')
const crypto = require("../../utils/crypto")
const {nanoid} = require('nanoid')


const recordTransfer = async (payload)=>{

    try {

        const db = admin.firestore()

        const res = await db.collection('bank/transactions/transfers').add(payload)
        return res.id
        
    } catch (error) {
        throw error
    }
    
}

const recordPayment = async (payload)=>{

    try {

        console.log(payload, "***********************")

        const db = admin.firestore()
        const payment_id = nanoid()

        const vendor = await customerDb.fetchUserByEmail(payload.payee_email)
        payload.payee_account_number = vendor.account_number

        await db.doc(`bank/transactions/customers/payments/payments/${payment_id}`).set({
            payment_date: new Date(),
            ...payload,
            id: payment_id
        })
        return {
            transaction_id: payment_id
        }
        
    } catch (error) {
        throw error
    }
    
}

const revertPayment = async (payment_id)=>{

    console.log("payment_id:", payment_id)

    try {

        const db = admin.firestore()

        const payment_ref = db.doc(`bank/transactions/customers/payments/payments/${payment_id}`)

        const res = await payment_ref.get()

        if(res.exists){
            const payment = res.data()
            console.log(payment_ref)
            
            await payment_ref.delete()
            await db.doc(`bank/transactions/customers/payments/refunds/${payment_id}`)
                    .set({
                        ...payment,
                        refund_date: new Date()
                    })

            return
        }else{
            throw new Error("Data doesn't exist")
        }

        
        
    } catch (error) {
        throw error
    }
    
}


const revertTransfer = async (transfer_id)=>{

    try {

        const db = admin.firestore()

        const transfer_ref = db.doc(`bank/transactions/bank/transfers/transfers/${transfer_id}`)
        const transfer = (await transfer_ref.get()).data()

        await transfer_ref.delete()
        await db.doc(`bank/transactions/bank/transfers/refunds/${transfer_ref.id}`).set(transfer)

        return
        
    } catch (error) {
        throw error
    }
    
}

const getPayments = async (account_number="")=>{

    console.log(account_number, "******************")

    try {

        const payments = []
        
        const db = admin.firestore()
        let paymentsRef ="" 

        if(!account_number){
            paymentsRef = db.collection(`bank/transactions/customers/payments/payments`)
        }else{
            paymentsRef = db.collection(`bank/transactions/customers/payments/payments`)
            .where("payee_account_number", "==", parseInt(account_number))
        }

                            
        const res = (await paymentsRef.get()).docs
        console.log(res)
        res.forEach((payment)=>{
            payments.push({
                ...payment.data(),
                transaction_type: "Client receipts"
            })
        })
        
        return payments

    } catch (error) {
        throw error
    }
    
}

const getRefunds = async (account_number="")=>{

    console.log(account_number, "in function get Refunds")

    try {

        const refunds = []
        
        const db = admin.firestore()
        let refundRef =""
        
        if(account_number){
            refundRef = db.collection(`bank/transactions/customers/payments/refunds`)
            .where("payee_account_number", "==", parseInt(account_number))
        }else{
            refundRef = db.collection(`bank/transactions/customers/payments/refunds`)
        }

        const res = await refundRef.get()

        res.forEach((refund)=>(
            refunds.push({
                ...refund.data(),
                transaction_type: "Client refunds"
            })
        ))
        
        return refunds

    } catch (error) {
        throw error
    }
    
}


///Bank

const getAllTransactions = async()=>{

    try {

        const  [refunds, payments] =  await Promise.all([getRefunds(), getPayments()])
        return[
            ...refunds,
            ...payments
        ]
        
    } catch (error) {
        throw error
    }

}

module.exports = {
    getPayments,
    getRefunds,
    recordTransfer,
    recordPayment,
    revertPayment,
    revertTransfer,
    getAllTransactions
}