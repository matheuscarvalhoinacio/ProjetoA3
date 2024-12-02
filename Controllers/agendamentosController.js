import moment from "moment";
import db from "../db.js";
import { verifySession } from "../utils/session.js";

const getDiasEHorariosDisponiveis = async (req, res) => {
  try {
    await verifySession(req, db);
    const ano = req.query.ano || 2024;
    const mes = req.query.mes || 12;

    const startDate = moment(`${ano}-${mes}-01`);
    const endDate = startDate.clone().endOf("month");
    const diasDoMes = [];

    for (
      let date = startDate;
      date.isSameOrBefore(endDate);
      date.add(1, "day")
    ) {
      diasDoMes.push(date.format("YYYY-MM-DD"));
    }

    const horariosDeTrabalho = [];
    for (let hora = 8; hora < 19; hora++) {
      horariosDeTrabalho.push(`${hora.toString().padStart(2, "0")}:00`);
    }

    const query = `
    SELECT DATE(data) as data, hora, status 
    FROM agendamentos 
    WHERE DATE(data) BETWEEN ? AND ? AND status IN ('pendente', 'confirmado')
  `;
    db.query(
      query,
      [diasDoMes[0], diasDoMes[diasDoMes.length - 1]],
      (err, resultados) => {
        if (err) {
          console.error("Erro ao consultar o banco de dados:", err);
          return res
            .status(500)
            .json({ error: "Erro ao consultar os horários ocupados" });
        }

        const horariosOcupadosPorDia = resultados.reduce(
          (acc, { data, hora }) => {
            const dataFormatada = moment(data).format("YYYY-MM-DD");
            if (!acc[dataFormatada]) acc[dataFormatada] = [];
            acc[dataFormatada].push(hora.slice(0, 5));
            return acc;
          },
          {}
        );

        const diasComHorariosDisponiveis = diasDoMes.map((dia) => {
          const data = moment(dia);
          const horariosOcupados = horariosOcupadosPorDia[dia] || [];
          const horariosDisponiveis = horariosDeTrabalho.filter(
            (hora) => !horariosOcupados.includes(hora)
          );

          if (data.day() === 0 || data.day() === 6) {
            return {
              data: dia,
              horarios_disponiveis: [],
            };
          }

          return {
            data: dia,
            horarios_disponiveis:
              horariosDisponiveis.length > 0
                ? horariosDisponiveis
                : horariosDeTrabalho,
          };
        });

        res.json(diasComHorariosDisponiveis);
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(401).json({ mensagem: "Não Autenticado" });
  }
};
const getHistorico = async (req, res) => {
  try {
    const user = await verifySession(req, db);

    const query = "SELECT * FROM agendamentos WHERE id_usuario = ? ";

    db.query(query, [user.id], (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao consultar agendamentos" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ mensagem: "Não Autenticado" });
  }
};
const ConfirmarAgendamento = async (req, res) => {
  try {
    const { id_agendamento, nome_doutor, id_doutor } = req.body;

    if (!id_agendamento || !nome_doutor || !id_doutor) {
      return res.status(400).json({ mensagem: "Dados incompletos para confirmar agendamento" });
    }

    const query = `
      UPDATE agendamentos 
      SET status = "confirmado", id_doutor = ?, nome_doutor = ?
      WHERE id = ?;
    `;

    db.query(query, [id_doutor, nome_doutor, id_agendamento], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mensagem: "Erro ao confirmar agendamento" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }

      return res.status(200).json({ mensagem: "Agendamento confirmado com sucesso" });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const getPendente = async (req, res) => {
  try {
    const user = await verifySession(req, db);
    const query = `
    SELECT agendamentos.*, usuarios.nome 
    FROM agendamentos 
    JOIN usuarios ON agendamentos.id_usuario = usuarios.id 
    WHERE agendamentos.status = "pendente"
  `;

    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao consultar agendamentos" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ mensagem: "Não Autenticado" });
  }
};
const setPendente = async (req, res) => {
  try {
    const user = await verifySession(req, db);
    const { id_agendamento, nome_doutor } = req.body;

    const query = `DELETE FROM agendamentos WHERE  id =?;`;

    db.query(query, [ id_agendamento], (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao confirmar agendamento" });
      }

      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ mensagem: "Agendamento não encontrado ou já confirmado" });
      }

      return res
        .status(200)
        .json({ mensagem: "Agendamento confirmado com sucesso", nome_doutor });
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ mensagem: "Não Autenticado" });
  }
};
const setAgendar = async (req, res) => {
  try {
    const user = await verifySession(req, db);

    if (!user) {
      return res.status(401).json({ mensagem: "Não Autenticado" });
    }

    const { data, hora } = req.body;

    console.log("Dados recebidos:", data, hora);

    const query = `INSERT INTO agendamentos (id_usuario, id_clinica, data, hora) VALUES (?, 1, ?, ?)`;
    db.query(query, [user.id, data, hora], (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao confirmar agendamento" });
      }

      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ mensagem: "Agendamento não encontrado ou já confirmado" });
      }

      return res
        .status(200)
        .json({ mensagem: "Agendamento confirmado com sucesso" });
    });
  } catch (error) {
    console.error("Erro no backend:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao agendar", error: error.message });
  }
};
const delAgenda = async (req, res) => {
  try {
    const user = await verifySession(req, db);

    if (!user) {
      return res.status(401).json({ mensagem: "Não Autenticado" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ mensagem: "ID do agendamento é necessário" });
    }

    const query = `DELETE FROM agendamentos WHERE id = ?;`;
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mensagem: "Erro ao cancelar agendamento" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }

      return res.status(200).json({ mensagem: "Agendamento cancelado com sucesso" });
    });
  } catch (error) {
    console.error("Erro no backend:", error);
    return res.status(500).json({ mensagem: "Erro ao agendar", error: error.message });
  }
};
const getUserAgenda = async (req, res) => {
  try {
    const user = await verifySession(req, db);

    if (!user) {
      return res.status(401).json({ mensagem: "Não Autenticado" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ mensagem: "ID do agendamento é necessário" });
    }

    const query = `DELETE FROM agendamentos WHERE id = ?;`;
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mensagem: "Erro ao cancelar agendamento" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }

      return res.status(200).json({ mensagem: "Agendamento cancelado com sucesso" });
    });
  } catch (error) {
    console.error("Erro no backend:", error);
    return res.status(500).json({ mensagem: "Erro ao agendar", error: error.message });
  }
}; 
const getUserConfirmado = async (req, res) => {
  try {
    const user = await verifySession(req, db);

    if (!user || !user.id) {
      return res.status(401).json({ mensagem: "Sessão inválida ou não autenticado" });
    }

    const query = `
      SELECT * FROM agendamentos WHERE  id_usuario = ? and status = "confirmado" ;

    `;

    db.query(query, [user.id], (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao consultar agendamentos" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ mensagem: "Não Autenticado" });
  }
};
const getAlunoConfirmado = async (req, res) => {
  try {
    const user = await verifySession(req, db);

    if (!user || !user.id) {
      return res.status(401).json({ mensagem: "Sessão inválida ou não autenticado" });
    }

    const query = `
      SELECT * FROM agendamentos WHERE id_doutor = ? AND status = "confirmado";
    `;

    db.query(query, [user.id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mensagem: "Erro ao consultar agendamentos" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ mensagem: "Não Autenticado" });
  }
};


export {
  getDiasEHorariosDisponiveis,
  getHistorico,
  ConfirmarAgendamento,
  getPendente,
  setPendente,
  setAgendar,
  delAgenda,
  getUserAgenda,
  getUserConfirmado,
  getAlunoConfirmado
};
