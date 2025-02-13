import express from 'express';
import cors from 'cors';
import Gadget from './models/Gadget.js';
import sequelize from './config/database.js';

const app = express();
app.use(cors());
app.use(express.json());

sequelize.sync().then(() => {
  console.log('Database synced');
});

app.get('/', (req, res) => {
    res.send('Welcome to the IMF Gadget API! 🚀');
  });

app.get('/gadgets', async (req, res) => {
  const gadgets = await Gadget.findAll();
  const gadgetsWithProbability = gadgets.map((gadget) => ({
    ...gadget.toJSON(),
    missionSuccessProbability: Math.floor(Math.random() * 100),
  }));
  res.json(gadgetsWithProbability);
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

app.post('/gadgets/:id/self-destruct', async (req, res) => {
  const { id } = req.params;
  const confirmationCode = Math.random().toString(36).substring(7);
  res.json({ confirmationCode });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});