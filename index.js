import express from 'express';
import cors from 'cors';
import agendamentosRoutes from './routes/agendamentosRouter.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);  
app.use('/api', agendamentosRoutes); 
app.use("/auth", authRoutes); 

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
