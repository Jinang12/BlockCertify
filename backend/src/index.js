require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const Blockchain = require('./blockchain');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize blockchain
const blockchain = new Blockchain();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(morgan('dev'));

// Add blockchain to request object
app.use((req, res, next) => {
  req.blockchain = blockchain;
  next();
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Blockchain initialized with ${blockchain.chain.length} blocks`);
});

module.exports = app;
