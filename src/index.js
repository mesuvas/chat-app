const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')
 
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

io.on('connection', (socket) =>{
    console.log('New web socket connection')

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room})
        
        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome !!'))

        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined the room`))

    })

    socket.on('sendMessage', (message, callback) => { 
        const filter = new Filter()
 
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.to('Center City').emit('message', generateMessage(message))
        callback()
    })

    socket.on('sendLocation', (cords, callback) => {
        io.emit( 'locationMessage', generateLocationMessage(`https://google.com/maps?q=${cords.latitude},${cords.longitude}`) )
        callback();
    })

    socket.on('disconnect', ()=>{
        removeUser(socket.id)
        io.emit('message', generateMessage('A user has left'))
    })    
})

app.use(express.static(publicDirectoryPath))

server.listen(port, () => {
    console.log('Server is running on port ' + port)
})