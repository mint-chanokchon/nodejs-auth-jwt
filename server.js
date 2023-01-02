const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
const bcrytp = require('bcrypt')
const jwt = require('jsonwebtoken')
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
});

const app = express()
const routes = express.Router() // for route with out auth
const routesAuth = express.Router() // for route with auth

// middleware
app.use(express.json())
app.use(cors())

// register api
routes.post('/register', async (req, res) => {
    const email = req.body?.email
    const password = req.body?.password
    const fname = req.body?.fname 
    const lname = req.body?.lname 

    // check if value in body is undefined
    if (!email || !password || !fname || !lname) {
        return res.status(400).json(setResponseReturn('Fail', null))
    }

    const passwordHash = await bcrytp.hashSync(password, 10)

    // save user
    await new Promise((resolve, reject) => {
        const queryString = 'INSERT INTO users (email, password, fname, lname) VALUES (?, ?, ?, ?)'
        mysqlConn.query(queryString, [email, passwordHash, fname, lname], (error, results, fields) => {
            if (error) reject(error)
            resolve()
        })
    }).catch(err => console.log(err))

    res.status(201).json(setResponseReturn('Successful.', null))
})

routes.post('/login', async (req, res) => {
    const email = req.body?.email
    const password = req.body?.password

    // check if value in body is undefined
    if (!email || !password) {
        return res.status(400).json(setResponseReturn('Fail', null))
    }

    // get user
    const user = await new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE email = ?'
        mysqlConn.query(query, [email], (error, results, field) => {
            if (error) reject(error)
            resolve(results[0])
        })
    }).catch(err => console.log(err))

    // check if user not found
    if (!user) return res.status(404).json(setResponseReturn('Email or Password invalid.', null))

    // check if password not match
    if(!await bcrytp.compareSync(password ,user.password)) return res.status(404).json(setResponseReturn('Email or Password invalid.', null))

    // create token
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' })

    res.status(200).json(setResponseReturn('Successful.', token))
})

routesAuth.get('/', [authentication()], async (req, res, next) => {
    const users = await new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users'
        mysqlConn.query(query, (error, results, fields) => {
            if (error) reject(error)
            resolve(results)
        })
    })

    res.status(200).send(setResponseReturn('Succcessful.', users))
})

app.use(routes)
app.use(routesAuth)

// start server
app.listen(PORT, () => console.log(`Server start at http://localhost:${PORT}`))

// for response model
function setResponseReturn(message, data) {
    return { message: message, data: data }
}

// for check client send token on header
function authentication() {
    return async (req, res, next) => {
        let bearerToken = req.headers?.authorization

        // check token is undefined
        if (!bearerToken) return res.status(401).send()

        // split from 'Bearer' and 'token'
        bearerToken = bearerToken.split(' ')
        if (bearerToken.length > 2) return res.status(400).send()

        const token = bearerToken[1]

        // get payload
        const userPayload = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) reject(err)
                resolve(decoded)
            })
        }).catch(err => {
            res.status(400).json(setResponseReturn('invalid token', null))
            return undefined; // if token invalid, return undefined
        })

        // save payload to req
        if (userPayload) {
            req.userPayload = userPayload
            next()
        }
    }
}