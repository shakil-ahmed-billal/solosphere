const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const express = require('express')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldsdi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    // create mongoDB data base 
    const db = client.db('solo-db')
    const jobsCollection = db.collection('jobs')
    const bidsCollection = db.collection('bids')

    // user request verify section for json web token
    app.post('/jwt' , (req , res)=>{
      const user = req.body;
      const token = jwt.sign(user , process.env.SECRETE , {expiresIn: '12h'})
      res.send(token)
      console.log(token)
    })



    // all jobs show ui api section
    app.get('/jobs' , async(req ,res)=>{
      const cursor = jobsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    // api job details api section 
    app.get('/job/:id' , async(req , res)=>{
      const id = req.params.id;
      const cursor = {_id: new ObjectId(id)}
      const result = await jobsCollection.findOne(cursor)
      res.send(result)
    })
    // solo jobs create section api 
    app.post('/add-job' , async(req , res)=>{
      const job = req.body;
      const result = await jobsCollection.insertOne(job)

      console.log(job)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      ' You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)
app.get('/', (req, res) => {
  res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
