const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const express = require('express')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000


app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true ,
  optionalSuccessStatus: 200,
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req , res , next) =>{
  const token = req.cookies?.token;
  console.log(token)

  if(!token){
    return res.status(401).send({message: 'Unauthorize Access User'})
  }
  jwt.verify(token , process.env.SECRETE , (err , decode)=>{
    if(err){
      return res.status(401).send({message: 'Unauthorize Access User'})
    }
    req.user = decode
    next()
  })
}

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

      res
      .cookie('token' , token , {
        httpOnly: true ,
        secure: process.env.NODE_ENV === 'production' ,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send(token)
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
    // my-posted-jobs section api make
    app.get('/my-posted-jobs/:email' , async(req , res)=>{
      const email = req.params.email;
      const cursor = {"buyer.email": email}
      const result = await jobsCollection.find(cursor).toArray()
      res.send(result)
    })
    // my bid section api make
    app.get('/my-bids/:email' , verifyToken, async(req , res)=>{
      const email = req.params.email;
      const user = req.user;

      if(email !== user.email){
        return res.status(401).send({message: 'cote user'})
      }

      const query = {email};
      const result = await bidsCollection.find(query).toArray()
      res.send(result)
    })
    // bid request section api make
    app.get('/bid-request/:email' , async(req ,res)=>{
      const email = req.params.email;
      const query = {buyer: email};
      const result = await bidsCollection.find(query).toArray()
      res.send(result);
    })




    // solo jobs create section api 
    app.post('/add-job' , async(req , res)=>{
      const job = req.body;
      const result = await jobsCollection.insertOne(job)

      console.log(job)
      res.send(result)
    })
    // user job bid section api section
    app.post('/add-bid' , async(req , res)=>{
      const data = req.body;

      // already apply for this job (filter)
      const cursor = {email: data.email , _id: new ObjectId(data.job_id)}
      const filter = await bidsCollection.findOne(cursor)
      if(filter){
        return res
        .status(400)
        .send({message: 'you have Already bid this job!'})
      }

      // increase bid count of data base
      const query = {_id: new ObjectId(data.job_id)}
      const updateDoc = {
        $inc: {bid_count: 1}
      }
      const bidCountUpdate = await jobsCollection.updateOne(query , updateDoc)

      // add user bid for job post 
      const result = await bidsCollection.insertOne(data)
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
