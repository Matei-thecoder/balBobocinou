// Script pentru resetarea voturilor în MongoDB
// Rulează cu: node resetVotes.js

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function resetVotes() {
  try {
    await client.connect();
    console.log("Conectat la MongoDB!");
    
    const db = client.db("bal2");
    
    // 1. Șterge toate voturile
    const deletedVotes = await db.collection("votes").deleteMany({});
    console.log(`✓ ${deletedVotes.deletedCount} voturi șterse`);
    
    // 2. Resetează contorul de voturi la 0 pentru toți participanții
    const updatedParticipants = await db.collection("concurenti").updateMany(
      {},
      { $set: { voturi: 0 } }
    );
    console.log(`✓ ${updatedParticipants.modifiedCount} participanți resetați`);
    
    // 3. (Opțional) Resetează statusul votării la oprit
    await db.collection("settings").updateOne(
      { key: "votingEnabled" },
      { $set: { value: false, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log("✓ Votarea a fost oprită");
    
    console.log("\n🎉 Reset complet! Toate voturile au fost șterse.");
    
  } catch (error) {
    console.error("Eroare:", error);
  } finally {
    await client.close();
  }
}

resetVotes();
