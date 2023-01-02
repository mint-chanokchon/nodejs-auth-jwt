const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
require('dotenv').config()

const PORT = 3000
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
}).connect((err) => {
    if (err) {
        throw new Error(err)
    }
    console.log('Connection successful')
});


const app = express()

app.use(cors())

app.listen(PORT, () => console.log(`Server start at http://localhost:${PORT}`))