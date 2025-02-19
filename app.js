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

app.use(cors({
  origin: ['https://imf-gadget-api-0akv.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api-docs', 
  swaggerUi.serve,
  swaggerUi.setup(YAML.load('./swagger.yaml'), {
    explorer: true,
    customSiteTitle: "IMF Gadget API Docs"
  })
);

sequelize.sync().then(() => {
  console.log('Database synced');
});

app.get('/', (req, res) => {
  res.send('Welcome to the IMF Gadget API! 🚀');
});

app.get('/gadgets', async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};
    const gadgets = await Gadget.findAll({ where: whereClause });
    
    const gadgetsWithProbability = gadgets.map(gadget => ({
      ...gadget.toJSON(),
      missionSuccessProbability: Math.floor(Math.random() * 100)
    }));
    
    res.json(gadgetsWithProbability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.create({ username, password });
    res.status(201).json({
      id: user.id,
      username: user.username
    });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/gadgets', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const codename = `The ${name}`;
    const gadget = await Gadget.create({ name: codename });
    res.status(201).json(gadget);
  } catch (error) {
    res.status(400).json({ error: 'Gadget creation failed' });
  }
});

app.patch('/gadgets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const gadget = await Gadget.findByPk(id);
    
    if (!gadget) return res.status(404).json({ error: 'Gadget not found' });
    
    if (name) gadget.name = name;
    if (status) gadget.status = status;
    
    await gadget.save();
    res.json(gadget);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

app.delete('/gadgets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const gadget = await Gadget.findByPk(id);
    
    if (!gadget) return res.status(404).json({ error: 'Gadget not found' });
    
    gadget.status = 'Decommissioned';
    gadget.decommissionedAt = new Date();
    await gadget.save();
    
    res.json({ message: 'Gadget decommissioned' });
  } catch (error) {
    res.status(400).json({ error: 'Decommission failed' });
  }
});

app.post('/gadgets/:id/self-destruct', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const gadget = await Gadget.findByPk(id);
    
    if (!gadget) return res.status(404).json({ error: 'Gadget not found' });
    
    gadget.status = 'Destroyed';
    gadget.destroyedAt = new Date();
    await gadget.save();
    
    const confirmationCode = Math.random().toString(36).substring(7);
    res.json({ confirmationCode });
  } catch (error) {
    res.status(400).json({ error: 'Self-destruct failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});