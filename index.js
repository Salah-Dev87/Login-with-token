const express = require('express');
const app = express();
const mysql = require('mysql')
const jwt = require("jso")
const fs = require("fs")
require('dotenv').config()

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
})
db.connect((err) => {
    if(err) throw err;
    console.log("Connected...")
})
const logFilePath = 'log.txt';
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '');
}
app.use(express.json())


app.post("/login", (req, res)=>{
    const {username, email, password} = req.body
    db.query("SELECT * FROM users WHERE username= ? AND email = ? AND password = ?", [username, email, password], (err, result)=>{
        if(err) {
            return res.send({
                status: false,
                message: err.sqlMessage
            })  
        }
        if(result.length > 0 ) {
            const token = jwt.sign({user: result[0].id},process.env.TOKEN_PRV, {expiresIn: "60s"})
            db.query("UPDATE users SET token = ? WHERE id = ?", [token, result[0].id])
            const timesLogin = new Date().toISOString();
            const logLine = `${username} - ${timesLogin} - ${token}\n`

            fs.appendFile(logFilePath, logLine, (err) => {
                if (err) {
                  console.error(`Error writing to log file: ${err}`);
                }
              });

            return res.send({
                status: true,
                user:{
                    ...result[0],
                    token
                }
                
            })
        }
        res.send({
            status: false,
            message: "l'utilisateur n'exeste pas"
        })
    })
})

app.listen(3000, () => {
  console.log('Server is starting');
});