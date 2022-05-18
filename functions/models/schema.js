const Yup = require('yup')
const joi = require('joi')
const {joiPassword} = require('joi-password')

const validatePhoneNumber = (number)=>{

    const phone_schema = joi.string()
                    .phoneNumber({defaultCountry: 'GH'})
                    .required()

    return  phone_schema.validate(number)
    
}

const validateLogin = (payload)=>{

    const login_schema = joi.object({
        email: joi.string().email().required(),
        password: joiPassword.string().min(5).max(30).required()
    })

    return login_schema.validate(payload)
    
}

const validateEcommerceLoginPayload = (payload)=>{

    const login_schema = joi.object({
        shop_name: joi.string().min(5).max(30).required(),
        password: joiPassword.string().min(5).max(12).required()
    })

    return login_schema.validate(payload)
    
}

const validateLogout = (payload)=>{

  const logout_schema = joi.object({
      email: joi.string().email().required()
  })

  return logout_schema.validate(payload)
  
}


const validateRegistrationPayload = (payload)=>{

  console.log(payload, "*******************")


    const registration_schema = joi.object({
        full_name: joi.string().min(3).max(30).required(),
        phone: joi.string().min(8).max(20).required(),
        email: joi.string().email().required(),
        password: joiPassword.string().noWhiteSpaces().min(5).max(30).required()
    })

    return registration_schema.validate(payload)
    
}

const validateEcommerceRegistrationPayload = (payload)=>{


    const registration_schema = joi.object({
        shop_name: joi.string().min(3).max(30).required(),
        gcb_pay_id: joi.string().email().required(),
        password: joiPassword.string().noWhiteSpaces().min(5).max(30).required()
    })

    return registration_schema.validate(payload)
    
}

const validateTransactionPayload = (payload) => {

    const card_number_regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/


    const schema = Yup.object({
      fee_id: Yup.number().integer().min(1).label("fee_id").required(),
      is_card: Yup.number().integer().label("is_card").max(1).required(),
      merchant_id: Yup.number().integer().min(1).label("merchant_id").required(),
      merchant_card_terminal_id: Yup.number()
        .integer()
        .min(1)
        .label("merchant_card_terminal_id"),
      merchant_wallet_terminal_id: Yup.number()
        .integer()
        .min(1)
        .label("merchant_wallet_terminal_id"),
      paid_by: Yup.number().integer().min(1).label("paid_by").required(),
      payer_wallet_no: Yup.string()
        .min(6)
        .max(20)
        .label("payer_wallet_no"),
      payer_wallet_telco: Yup.string()
        .min(3)
        .max(20)
        .label("payer_wallet_telco"),
      payer_card_no: Yup.string().matches(card_number_regex),
      payer_name_on_card: Yup.string().min(3).max(100),
      payer_card_expiry: Yup.string()
        .min(5)
        .max(5)
        .label("payer_card_expiry"),
      payer_cvv: Yup.string().min(3).max(3).required(),
      amount: Yup.number().positive().label("amount").required(),
      ccy: Yup.string().min(3).max(3).label("ccy").required(),
    })
      
    return schema.isValid(payload);
  
  };


const validateTransferPayload = (payload)=>{

  const makePaymentSchema = joi.object({
      payee_name: joi.string().min(5).max(30).required(),
      payee_account_number: joi.string().min(8).max(17).required(),
      amount: joi.number().less(20000).required().label("Amount exceeds maximum transaction threshold"),
      payee_phone: joi.string().min(8).max(20).required(),
      payee_email: joi.string().email().required(),
      payer_email: joi.string().email().required()
  })

  return makePaymentSchema.validate(payload)
  
}

const validatePaymentPayload = (payload)=>{

  const makePaymentSchema = joi.object({
      payer_credit_card_name: joi.string().min(5).max(30).required(),
      payer_credit_card_number: joi.string().min(12).required(),
      payer_credit_card_expiry_date: joi.string().required(),
      payer_credit_card_cvc: joi.string().min(3).max(3).required(),
      payer_name: joi.string().min(5).max(30).required(),
      amount: joi.number().less(20000).required().label("Amount exceeds maximum transaction threshold"),
      payer_phone: joi.string().min(8).max(20).required(),
      payer_email: joi.string().email().required(),
      payee_email: joi.string().email().required(),
  })

  return makePaymentSchema.validate(payload)
  
}

const validateGetPaymentsPayload = (payload)=>{

  const getPaymentsSchema = joi.object({
      account_number: joi.string().min(8).max(17).required()
  })

  return getPaymentsSchema.validate(payload)
  
}


const validateGetRefundsPayload = (payload)=>{

  const getRefundsSchema = joi.object({
      account_number: joi.string().min(8).max(17).required()
  })

  return getRefundsSchema.validate(payload)
  
}

const validateRefundPaymentPayload = (payload)=>{

  const refundPaymentSchema = joi.object({
      payment_id: joi.string().min(18).max(30).required(),
      email: joi.string().email().required(),
      password: joiPassword.string().noWhiteSpaces().min(5).max(30).required()
  })

  return refundPaymentSchema.validate(payload)
  
}


module.exports = {
    validateLogin,
    validateLogout,
    validatePhoneNumber,
    validateRegistrationPayload,
    validateTransactionPayload,
    validateTransferPayload,
    validatePaymentPayload,
    validateGetPaymentsPayload,
    validateRefundPaymentPayload,
    validateGetRefundsPayload,
    validateEcommerceRegistrationPayload,
    validateEcommerceLoginPayload
}