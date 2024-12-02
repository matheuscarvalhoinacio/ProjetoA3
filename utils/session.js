const verifySession =  async(request,db)=>{
    const token  = request.headers.token
    const q = `SELECT u.* FROM sessions s JOIN usuarios u ON s.usuario_id = u.id WHERE s.id = "${token}"`
    return new Promise ((resolve, promiseErro) => {
        db.query(q, (dberr,data)=> {
            if(dberr || data.length === 0 )return  promiseErro()
            resolve(data[0])
        })
    })
}

export {verifySession}