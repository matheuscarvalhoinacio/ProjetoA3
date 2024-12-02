import db from '../db.js';

const createUser = (request, res) => {
  const { name, email, password, cpf } = request.body;

  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  const query = `INSERT INTO usuarios (nome, email, senha, cpf) VALUES (?, ?, ?, ?)`;
  db.query(query, [name, email, password, cpf], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro ao criar usuário", error: err });
    }
    return res.status(201).json({ message: "Usuário criado com sucesso", data });
  });
};

export { createUser };
