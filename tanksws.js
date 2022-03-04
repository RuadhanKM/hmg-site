(function() {
	module.exports.main = function(hostname) {
		const ws = require('ws')
		const wss = new ws.WebSocketServer({ port: 6969 })

		var games = {}

		// Fired when a new user connects
		wss.on('connection', function connection(ws) {	
			var ip = ws._socket.remoteAddress.slice(7)
		
			// fired when message is recived
			ws.on('message', function message(rawdata) {
				var message = JSON.parse(rawdata)
				
				if (message.prot == "setup" && message.data.hosting && !(ip in games)) {
					games[ip] = {"map": message.data.map, "started": false, "hostSocket": ws}
					
					ws.send(JSON.stringify( {"prot": "setup", "data": {"ip": ip}} ))
					console.log("New tanks online server: " + ip)
				}
				if (message.prot == "setup" && !message.data.hosting && !games[message.data.host].started /*&& !(ip in games)*/) {
					if (!games[message.data.host]) {
						ws.send(JSON.stringify({"prot": "error", "data": {"message": "Server not found!"}}))
					}
					
					games[message.data.host].clientSocket = ws
					games[message.data.host].hostSocket.send(JSON.stringify({"prot": "setup", "data": {"start": true}}))
					ws.send(JSON.stringify({"prot": "setup", "data": {"start": true, "map": games[message.data.host].map}}))
					
					ws.game = games[message.data.host]
					games[message.data.host].hostSocket.game = games[message.data.host]
					
					console.log("New tanks online connection: " + message.data.host + " - " + ip)
				}
				if (message.prot == "update" || message.prot == "shoot") {
					if (message.data.hosting) {ws.game.clientSocket.send(JSON.stringify(message))}
					if (!message.data.hosting) {ws.game.hostSocket.send(JSON.stringify(message))}
				}
			})
			
			// Fired when user disconnects
			ws.on('close', function closed() {
				
			})
		})
	}
}())