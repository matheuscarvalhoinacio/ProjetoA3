import { Router } from 'express';
import { 
  getDiasEHorariosDisponiveis, 
  getHistorico, 
  ConfirmarAgendamento, 
  getPendente, 
  setPendente, 
  setAgendar, 
  delAgenda,
  getUserConfirmado,
  getAlunoConfirmado
  
} from '../Controllers/agendamentosController.js';

const agendamentosRouter = Router();

agendamentosRouter.get('/dias-horarios-disponiveis', getDiasEHorariosDisponiveis);
agendamentosRouter.get('/getHistico', getHistorico); 
agendamentosRouter.get('/getUserConfirmado', getUserConfirmado); 
agendamentosRouter.get('/getAlunoConfirmado', getAlunoConfirmado);
agendamentosRouter.post('/ConfirmarAgendamento', ConfirmarAgendamento);
agendamentosRouter.get('/getPendente', getPendente);
agendamentosRouter.post('/setPendente', setPendente);
agendamentosRouter.post('/setAgendar', setAgendar);
agendamentosRouter.delete('/delAgenda/:id', delAgenda);

export default agendamentosRouter;
