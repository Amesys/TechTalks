const express = require('express')

const server = express()
server.use(express.static('public'))

server.listen(1337, function () {
	console.log('Tech Talks server listening on port 1337 🔥 ')
})
