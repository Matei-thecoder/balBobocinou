const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Mapping țări la gender
const genderMapping = {
  'Taisia': 'miss',
  'Mina': 'miss',
  'Giulia': 'miss',
  'David': 'mister',
  'Bianca': 'miss',
  'Matei': 'mister',
  'DenisaMaria': 'miss',
  'Horia': 'mister',
  'Anastasia': 'miss',
  'AlejandroCristy': 'mister',
  'Denisa': 'miss',
  'Darius': 'mister'
};

// Mapping țări la specializări
const specializari = ['Ingineria Sistemelor', 'Calculatoare și Tehnologia Informației'];

async function loadParticipants() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('bal2');
    const collection = db.collection('concurenti');

    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing participants');

    // Read participants folder
    const participantsDir = path.join(__dirname, 'participanti');
    const files = fs.readdirSync(participantsDir);

    const participants = [];

    files.forEach((file, index) => {
      if (!file.endsWith('.jpg')) return;

      // Parse filename: Nume_Prenume_Tara.jpg
      const nameWithoutExt = file.replace('.jpg', '');
      const parts = nameWithoutExt.split('_');

      if (parts.length !== 3) {
        console.log(`Skipping invalid file: ${file}`);
        return;
      }

      const [nume, prenume, tara] = parts;
      const fullName = `${prenume} ${nume}`;
      
      // Determine gender based on first name
      const gender = genderMapping[prenume] || 'mister';
      
      // Assign specialization (alternating)
      const specializare = specializari[index % 2];

      const participant = {
        id: `${tara.toLowerCase()}-${index}`,
        name: fullName,
        nume: nume,
        prenume: prenume,
        photo: `/api/photo/${file}`,
        country: tara,
        description: `AC - ${specializare}`,
        gender: gender,
        voturi: 0,
        fileName: file
      };

      participants.push(participant);
      console.log(`Added: ${fullName} (${tara}) - ${gender}`);
    });

    // Insert into MongoDB
    if (participants.length > 0) {
      await collection.insertMany(participants);
      console.log(`\n✓ Successfully loaded ${participants.length} participants into MongoDB`);
    }

  } catch (error) {
    console.error('Error loading participants:', error);
  } finally {
    await client.close();
  }
}

loadParticipants();
