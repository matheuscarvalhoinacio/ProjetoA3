import mysql from 'mysql2';


const db = mysql.createConnection({
    host: "localhost",
    user:"root",
    password:"root",
    database: "clinica",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})
export default db; 