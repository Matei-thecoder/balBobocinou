const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;



// Middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(e)
  {
    console.error(e);
  }
}
run().catch(console.dir);


app.set("trust proxy", true);

app.get("/vote",async (req, res) => {
    const ip = req.ip;
    const vote = req.body.vote;

    const foundIp = await client.db("bal2").collection("ip").findOne({ip:ip});
    console.log(foundIp);
    if(foundIp)
    {
        res.send("You have already voted!");
        return;
    }

    await client.db("bal2").collection("ip").insertOne({ip:ip});
    const nrVotes = await client.db("bal2").collection("concurenti").findOne({id:`${vote}`});
    console.log(nrVotes);
    await client.db("bal2").collection("concurenti").updateOne({id:`${vote}`},{$set:{voturi:nrVotes.voturi+1}});
    res.send({"status":true, "message":"voted", "vote":vote});
    console.log("Vote from IP:", ip, "Vote:", vote);
    
});

app.get('/getvotes',async (req, res)=>{
    const concurenti = await client.db("bal2").collection("concurenti").find({}).toArray();
    res.send({"status":true, "data":concurenti});
});

app.get('/getvotes/:id',async (req, res)=>{
    const id = req.params.id;
    const concurent =  await client.db("bal2").collection("concurenti").findOne({"id":id});
    console.log(concurent);
    res.send({"status":true, "data":concurent});
});



if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;



