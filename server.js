const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
const bcrytp = require('bcrypt')
require('dotenv').config()

const PORT = 3000
const mysqlConn = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
})

// connect to mysql
mysqlConn.connect((err) => {
    if (err) {
        throw new Error(err)
    }
    console.log('Connection successful')
});

const response = { message: null, data: null }

const app = express()

// middleware
app.use(express.json())
app.use(cors())

// register api
app.post('/register', async (req, res) => {
    const email = req.body?.email
    const password = req.body?.password
    const fname = req.body?.fname 
    const lname = req.body?.lname 

    // check values is null or undefined
    if (!email || !password || !fname || !lname) {
        response.message = 'fail'
        return res.status(400).json({response})
    }

    const passwordHash = await bcrytp.hashSync(password, 10)
    await new Promise((resolve, reject) => {
        const queryString = 'INSERT INTO users (email, password, fname, lname) VALUES (?, ?, ?, ?)'
        mysqlConn.query(queryString, [email, passwordHash, fname, lname], (error, results, fields) => {
            if (error) reject(error)
            resolve()
        })
    }).catch(err => console.log(err))

    response.message = 'successful.'
    res.status(201).json({response})
})

// for reset response object
app.use((req, res, next) => { 
    response.data = null
    response.message = null
    next()
})

// start server
app.listen(PORT, () => console.log(`Server start at http://localhost:${PORT}`))