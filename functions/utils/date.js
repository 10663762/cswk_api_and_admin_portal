const getDateDaysFromNow = (days)=>{

    const now = new Date()
    return new Date(now.setDate(now.getDate() + days)).getTime()
    
}

module.exports = {
    getDateDaysFromNow
}

