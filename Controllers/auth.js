import db from "../db.js";
import { v4 as uuidv4 } from 'uuid';
import { verifySession } from "../utils/session.js";

const createSession = (request, res) => {
    const user = request.body.user;
    const password = request.body.password;
    
    if (!user || !password) {
        return res.status(403).json({ mensagem: 'Usuário ou senha não inseridos' });
    }

    const qUser = `SELECT * FROM usuarios WHERE cpf = "${user}" AND senha = "${password}"`;

    db.query(qUser, (err, result) => {
        if (err) {
            console.error('Erro na consulta ao banco:', err);
            return res.status(500).json({ mensagem: 'Erro no servidor' });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ mensagem: 'Usuário ou senha incorretos' });
        }

        const userId = result[0].id;
        const uuid = uuidv4();

        const q = `INSERT INTO sessions (id, usuario_id) VALUES ("${uuid}", "${userId}")`;
        
        db.query(q, (err) => {
            if (err) {
                console.error('Erro ao inserir a sessão:', err);
                return res.status(500).json({ mensagem: 'Erro ao criar sessão' });
            }

            return res.json({ token: uuid });
        });
    });
};

const verifySessionControll = async(request,res)=>{
    try {
        const user = await verifySession(request,db)
        return res.status(200).json({mensagem: "Autenticado" , user})

    } catch (error) {
        return res.status(401).json({mensagem:"Não Autenticado"})
    } 
}

const deleteSession = async(request, res)=>{
    try {
        await verifySession(request,db) 
        const token = request.headers.token
        const q = `DELETE FROM sessions WHERE id = "${token}"`
        db.query(q, (err,user)=>{
            if(err) return res.json(err)
            return res.json({mensagem: "ADEUS"})
        })
    } catch (error) {
        return res.status(401).json({mensagem:"Não Autenticado"})
    } 
}


export { createSession, verifySessionControll ,deleteSession }