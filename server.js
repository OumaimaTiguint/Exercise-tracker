const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongodb = require('mongodb').MongoClient
const cors = require('cors')
const User = require('./user')
const Exercise = require('./exercise')
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track', {useMongoClient: true})

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  res.json({status: 404, message: 'not found'})
})

//create a user by posting form data username to /api/exercise/new-user and returned will be an object with username and _id.
app.post('/api/exercise/new-user', (req, res)=> {
   if(!req.body.username) {
     res.send('Username cannot be blank')
   } else {
     const username = new User({ username, })
     username.save()
             .then(result => {
                   res.status(201).json({
                     username: result.username,
                     _id: result._id
                   })
             })
             .catch(error => {
                    res.status(500).json('Username already taken')
             })
   }
})

//get an array of all users by getting api/exercise/users with the same info as when creating a user.
app.get('api/exercise/users', (req, res) => {
  User.find()
      .select('username _id')
      .exec()
      .then(data => {res.status(200).json(data)})
  
})

//add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add.
app.post('/api/exercise/add', (req, res) => {
  let { userId, description, duration, date } = req.body
  
  if (!userId || !description || !duration) 
    return res.status(400).json('all fields must be included')
  
  if(date) {
    date = date
  } else {
    date = mongoose.moment()
                   .format()
                   .slice(0, 10)
  }
  
  User.findById(userId)
      .exec()
      .then(user => {
        if(user) {
          const data = new Exercise({
            userId: userId,
            description: description,
            duration: duration,
            date: date
          })
          data.save()
              .then(result => {
            res.status(200).json({
              message: 'exercise created successfully',
              request: result
            })
          })
        } else {
          res.status(404).json({message: 'ID is invalid'})
        }
      })
      .catch(error => {
        res.status(500).send(error)
      })
})

//retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id)
// retrieve part of the log of any user by also passing along optional parameters of from & to or limit
app.get('/api/exercise/log/?:userId/:from?/:to?/:limit', (req, res) => {
  let { userId, from, to, limit } = req.query
  
  if(!userId) return res.status(400).send('userId required')
  
  User.findOne({_id: userId}, (err, user) => {
    if(err) return res.status(400).send('invalid userId')
    
    if(!user) res.status(404).send('User not found')
    
    Exercise.find({userId: userId})
            .where('date')
            .gte(from ? new Date(from) : new Date(0))
            .where('date')
            .lte(to ? new Date(to) : new Date())
            .limit(limit ? Number(limit) : 1e10)
            .exec((err, results) => {
                if (err) return res.status(400).send(err.message);
                return res.json({
                        _id: userId,
                        username: user.username,
                        count: results.length,
                        log: results
               });
            });
  })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
