const express = require('express')
const fs = require('fs')
const os = require('os')

const chatws = require("./chatws.js")
const tanksws = require("./tanksws.js")

const app = express()
const port = 80
const hostname = os.networkInterfaces()['Wi-Fi'][0].address

chatws.main(hostname)
tanksws.main(hostname)

app.use('/chat', express.static("C:/Users/9281239/Documents/code/js/chat-room-2/public"))
app.use('/games', express.static("C:/Users/9281239/Documents/code/js/games/public"))

app.get('/tonl', (req, res) => {
	res.redirect("/games/tanks-online/?ip="+req.query.ip)
})

app.use('/', express.static("public"))

app.get('*', function(req, res){
	res.status(404).sendFile('C:/Users/9281239/Documents/code/js/hmg-site/public/404.html')
})

app.listen(port, hostname, () => {
	console.log(`App on ${hostname}:${port}`)
})