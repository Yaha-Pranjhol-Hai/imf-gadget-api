import express from 'express';
import cors from 'cors';
import Gadget from './models/Gadget.js';
import User from './models/User.js';
import sequelize from './config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticate } from './middleware/auth.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./swagger.yaml');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

sequelize.sync().then(() => {
  console.log('Database synced');
});


app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

app.get('/', (req, res) => {
    res.send('Welcome to the IMF Gadget API! 🚀');
  });

app.get('/gadgets', async (req, res) => {
  try{
    const { status } = req.query;
  const whereClause = status ? { status } : {};
  const gadgets = await Gadget.findAll({ where: whereClause });
  const gadgetsWithProbability = gadgets.map((gadget) => ({
    ...gadget.toJSON(),
    missionSuccessProbability: Math.floor(Math.random() * 100),
  }));
  res.json(gadgetsWithProbability);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/gadgets', async (req, res) => {
  const { name } = req.body;
  const codename = `The ${name}`;
  const gadget = await Gadget.create({ name: codename });
  res.status(201).json(gadget);
});

app.patch('/gadgets/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  const gadget = await Gadget.findByPk(id);
  if (gadget) {
    gadget.name = name || gadget.name;
    gadget.status = status || gadget.status;
    await gadget.save();
    res.json(gadget);
  } else {
    res.status(404).json({ error: 'Gadget not found' });
  }
});

app.delete('/gadgets/:id', async (req, res) => {
  const { id } = req.params;
  const gadget = await Gadget.findByPk(id);
  if (gadget) {
    gadget.status = 'Decommissioned';
    gadget.decommissionedAt = new Date();
    await gadget.save();
    res.json({ message: 'Gadget decommissioned' });
  } else {
    res.status(404).json({ error: 'Gadget not found' });
  }
});

app.post('/gadgets/:id/self-destruct', authenticate, async (req, res) => {
  const { id } = req.params;
  const gadget = await Gadget.findByPk(id);
  if (!gadget) return res.status(404).json({ error: 'Gadget not found' });

  gadget.status = 'Destroyed';
  gadget.destroyedAt = new Date();
  await gadget.save();

  const confirmationCode = Math.random().toString(36).substring(7);
  res.json({ confirmationCode });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.create({ username, password });
  res.status(201).json(user);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

app.use('/gadgets', authenticate);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});