const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4444;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/photos', express.static(path.join(__dirname, 'participanti')));

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

// Generate unique browser fingerprint (without IP to allow multiple users on same network)
function generateFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    const fingerprint = `${userAgent}-${acceptLanguage}-${acceptEncoding}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

app.post("/vote", async (req, res) => {
    try {
        const vote = req.body.vote;
        const browserFingerprint = req.body.fingerprint || generateFingerprint(req);
        
        // Check if voting is enabled
        const votingStatus = await client.db("bal2").collection("settings").findOne({key: "votingEnabled"});
        if (!votingStatus || !votingStatus.value) {
            return res.send({status: false, message: "Votarea nu a început încă!"});
        }
        
        // Check if participant exists and get gender
        const participant = await client.db("bal2").collection("concurenti").findOne({id: vote});
        if (!participant) {
            return res.send({status: false, message: "Participant invalid!"});
        }

        const gender = participant.gender; // 'miss' or 'mister'
        
        // Check if browser fingerprint has voted for this gender (removed IP check)
        const foundFingerprint = await client.db("bal2").collection("votes").findOne({
            fingerprint: browserFingerprint,
            gender: gender
        });
        if (foundFingerprint) {
            return res.send({
                status: false, 
                message: `Ai votat deja pentru ${gender === 'miss' ? 'Miss Boboc' : 'Mister Boboc'}: ${foundFingerprint.participantName}!`,
                votedFor: foundFingerprint.vote,
                votedName: foundFingerprint.participantName
            });
        }

        // Record vote with fingerprint only
        await client.db("bal2").collection("votes").insertOne({
            fingerprint: browserFingerprint,
            vote: vote,
            gender: gender,
            participantName: participant.name,
            timestamp: new Date()
        });

        // Update vote count
        await client.db("bal2").collection("concurenti").updateOne(
            {id: vote},
            {$set: {voturi: participant.voturi + 1}}
        );

        res.send({
            status: true, 
            message: "Vot înregistrat cu succes!", 
            vote: vote,
            votedName: participant.name,
            gender: gender
        });
        console.log("Vote from Fingerprint:", browserFingerprint.substring(0, 10), "Vote:", vote, "Gender:", gender);
        
    } catch (error) {
        console.error("Voting error:", error);
        res.status(500).send({status: false, message: "Eroare la procesarea votului"});
    }
});

app.get('/participants', async (req, res) => {
    try {
        const participants = await client.db("bal2").collection("concurenti").find({}).toArray();
        console.log("Fetched participants:", participants);
        res.send({status: true, data: participants});
    } catch (error) {
        console.error("Error fetching participants:", error);
        res.status(500).send({status: false, message: "Eroare la obținerea participanților"});
    }
});

app.get('/getvotes', async (req, res) => {
    try {
        const concurenti = await client.db("bal2").collection("concurenti").find({}).toArray();
        res.send({status: true, data: concurenti});
    } catch (error) {
        res.status(500).send({status: false, message: "Eroare"});
    }
});

app.get('/getvotes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const concurent = await client.db("bal2").collection("concurenti").findOne({id: id});
        res.send({status: true, data: concurent});
    } catch (error) {
        res.status(500).send({status: false, message: "Eroare"});
    }
});

// Check if user has voted for Miss and/or Mister
app.post('/check-vote', async (req, res) => {
    try {
        const browserFingerprint = req.body.fingerprint || generateFingerprint(req);
        
        // Check votes for both genders (fingerprint only)
        const missVote = await client.db("bal2").collection("votes").findOne({fingerprint: browserFingerprint, gender: 'miss'});
        const misterVote = await client.db("bal2").collection("votes").findOne({fingerprint: browserFingerprint, gender: 'mister'});
        
        res.send({
            status: true,
            missVoted: !!missVote,
            missVotedFor: missVote ? missVote.vote : null,
            missVotedName: missVote ? missVote.participantName : null,
            misterVoted: !!misterVote,
            misterVotedFor: misterVote ? misterVote.vote : null,
            misterVotedName: misterVote ? misterVote.participantName : null
        });
    } catch (error) {
        res.status(500).send({status: false, message: "Eroare"});
    }
});

// Check if voting is enabled
app.get('/voting-status', async (req, res) => {
    try {
        const votingStatus = await client.db("bal2").collection("settings").findOne({key: "votingEnabled"});
        res.send({
            status: true,
            votingEnabled: votingStatus ? votingStatus.value : false
        });
    } catch (error) {
        res.status(500).send({status: false, message: "Eroare"});
    }
});

// Admin: Toggle voting
app.post('/admin/toggle-voting', async (req, res) => {
    try {
        const { password, enabled } = req.body;
        
        // Check admin password
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).send({status: false, message: "Parolă incorectă!"});
        }
        
        // Update voting status
        await client.db("bal2").collection("settings").updateOne(
            {key: "votingEnabled"},
            {$set: {value: enabled, updatedAt: new Date()}},
            {upsert: true}
        );
        
        res.send({
            status: true,
            message: enabled ? "Votarea a fost pornită!" : "Votarea a fost oprită!",
            votingEnabled: enabled
        });
    } catch (error) {
        res.status(500).send({status: false, message: "Eroare"});
    }
});

// Admin: Get statistics
app.post('/admin/statistics', async (req, res) => {
    try {
        const { password } = req.body;
        
        // Check admin password
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).send({status: false, message: "Parolă incorectă!"});
        }
        
        // Get all participants with votes
        const participants = await client.db("bal2").collection("concurenti").find().toArray();
        
        // Get voting status
        const votingStatus = await client.db("bal2").collection("settings").findOne({key: "votingEnabled"});
        
        // Count total votes by gender
        const missVotes = await client.db("bal2").collection("votes").countDocuments({gender: 'miss'});
        const misterVotes = await client.db("bal2").collection("votes").countDocuments({gender: 'mister'});
        
        res.send({
            status: true,
            votingEnabled: votingStatus ? votingStatus.value : false,
            participants: participants,
            totalVotes: {
                miss: missVotes,
                mister: misterVotes,
                total: missVotes + misterVotes
            }
        });
    } catch (error) {
        res.status(500).send({status: false, message: "Eroare"});
    }
});

// Development: Reset votes for specific fingerprint
app.post('/dev/reset-my-votes', async (req, res) => {
    try {
        const browserFingerprint = req.body.fingerprint || generateFingerprint(req);
        
        // Delete all votes for this fingerprint
        const result = await client.db("bal2").collection("votes").deleteMany({
            fingerprint: browserFingerprint
        });
        
        console.log(`Deleted ${result.deletedCount} votes for fingerprint: ${browserFingerprint.slice(0, 20)}...`);
        
        res.send({
            status: true,
            message: `${result.deletedCount} voturi șterse!`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error resetting votes:', error);
        res.status(500).send({status: false, message: "Eroare"});
    }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;

