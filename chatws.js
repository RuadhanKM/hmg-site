(function() {
	module.exports.main = function(hostname) {
		const customColors = require('../chat-room-2/custom-colors.json')
		const ws = require('ws')

		customColors[hostname] = customColors.host

		var messages = []
		var users = {}
		var bans = []

		function hashCode(str) {
			var hash = 0, i, chr
			if (str.length === 0) return hash
			for (i = 0; i < str.length; i++) {
				chr   = str.charCodeAt(i)
				hash  = ((hash << 5) - hash) + chr
				hash |= 0
			}
			return hash
		}
		function hashToColor(hash) {
			return "#" + hash.toString(16).slice(0, 6)
		}
		function xssProtection(message) {
			if (message[0]) {
				var protectedMes = message.map(x => x.replace(/</g, "&lt"))
				protectedMes = protectedMes.map(x => x.replace(/>/g, "&gt"))
				return protectedMes
			}
		}
		function getColor(ip) {
			var color = hashToColor(hashCode(ip))
			
			if (customColors[ip]) {
				color = customColors[ip]
			}
			
			return color
		}
		function updateOnline() {
			var mes = {}
			
			var filteredUsers = []
			var duplicateIPChecker = []
			wss.clients.forEach(function each(client) {
				if (users[client._socket.remoteAddress.slice(7)].name && !(client._socket.remoteAddress in duplicateIPChecker)) {
					filteredUsers.push(users[client._socket.remoteAddress.slice(7)])
					duplicateIPChecker[client._socket.remoteAddress] = ""
				}
			})
			mes.onl = filteredUsers
			

			wss.clients.forEach(function each(client) {
				if (client.readyState === 1) {
					client.send(JSON.stringify(mes))
				}
			})
		}
		function newClientSetup(ws) {
			// Update new users with previous messages
			for (const messageObj of messages) {
				ws.send(JSON.stringify({"mes": [messageObj.name, messageObj.message, messageObj.color]}))
			}
			
			// Add new user's ip to online users
			if (!(ws._socket.remoteAddress.slice(7) in users)) {
				users[ws._socket.remoteAddress.slice(7)] = {"color": getColor(ws._socket.remoteAddress.slice(7))}
			}
		}
		function handleAdminCommands(command, ws) {
			if (command[0] == "clear") {
				messages = []
			}
			if (command[0] == "ban") {
				if (command[2]) {
					bans[command[1]] = command.slice(2).join(" ")
				} else {
					ws.send(JSON.stringify({"server_error": "No ban message!"}))
				}
			}
			if (command[0] == "get_onl") {
				for (const user of Object.keys(users)) {
					console.log(users[user].name + " " + user)
				}
			}
			if (command[0] == "eval") {
				eval(command[1])
			}
		}

		const wss = new ws.WebSocketServer({ port: 8080 })

		// Fired when a new user connects
		wss.on('connection', function connection(ws) {	

			newClientSetup(ws)
			
			// fired when message is recived
			ws.on('message', function message(rawdata) {
				var data = xssProtection(JSON.parse(rawdata))
				if (!data) {return}
				
				if (data[2]) { // if is an image embed
					data[1] = '<img src="' + data[1] + '" style="max-width:400px;width:100%;max-height:400px;height:100%;" />'
				}
				
				var ip = ws._socket.remoteAddress.slice(7)
				var name = data[0]
				
				if (ip in bans) {
					ws.send(JSON.stringify({"server_error": "You have been banned for: " + bans[ip]}))
					return
				}

				// if data is a message
				if (data.length >= 2) {
					var message = data[1]
					var color = getColor(ip)
					
					users[ip].name = name
					
					var messageObj = {}
					messageObj.ip = ip
					messageObj.name = name
					messageObj.message = message
					messageObj.color = color
					
					if (data.length == 2) {
						console.log(name + ": " + message)
					} else if (data.length == 3) {
						console.log(name + ": " + data[2])
					}
					
					// handle server commands
					if (message.slice(0,2) == "//" && ip == hostname) {
						handleAdminCommands(message.slice(2).split(" "), ws)
						return
					}
					
					messages.push(messageObj)
					
					// relay message to all clients
					wss.clients.forEach(function each(client) {
						if (client.readyState === 1) {
							client.send(JSON.stringify({"mes": [name, message, color]}))
						}
					})
				}
				// if data is a name confirmation
				if (data.length == 1) {
					users[ip].name = name
					updateOnline()
				}
			})
			
			// Fired when user disconnects
			ws.on('close', function closed(ws) {
				updateOnline()
			})
		})
	}
}())