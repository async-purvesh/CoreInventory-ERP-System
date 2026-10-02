require('dotenv').config()
const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoute = require('./routes/auth.routes')
const inventoryRoute = require('./routes/inventory.routes');

const app = express()
// app.use(cors({
// 	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
// 	credentials: true,
// }));

app.use(express.static("/Users/Purvesh/Desktop/5Sem/FSD/Assignment/odooXindus-main/Backend/dist"))
app.use(express.json())
app.use(cookieParser());
app.use('/api/auth', authRoute);
app.use('/api/inventory', inventoryRoute);


module.exports = app