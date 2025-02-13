import DataTypes from 'sequelize';
import sequelize from '../config/database.js';

const Gadget = sequelize.define('Gadget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('Available', 'Deployed', 'Destroyed', 'Decommissioned'),
  },
  decommissionedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default Gadget; 
