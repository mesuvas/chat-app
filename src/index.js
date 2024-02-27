const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')
const { error } = require('console')
 
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

io.on('connection', (socket) =>{
    console.log('New web socket connection')

    socket.on('join', (options) => {

        const user = addUser({id:socket.id, ...options})

         
        socket.join(user.room);
 
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
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
        }
     })    
})

app.use(express.static(publicDirectoryPath))

server.listen(port, () => {
    console.log('Server is running on port ' + port)
})