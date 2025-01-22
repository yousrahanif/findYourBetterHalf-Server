const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app=express()
const port = process.env.PORT || 5000
app.use(cors())

app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');






// const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.gm35c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gm35c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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



const biodataCollection=client.db('metrimonyDb').collection('biodata')
const successCollection=client.db('metrimonyDb').collection('success')
const favoritebiodata=client.db('metrimonyDb').collection('favoritebiodata')

const userCollection=client.db('metrimonyDb').collection('users')


app.get('/biodata', async(req,res)=>{
    const result=await biodataCollection.find().toArray()
    res.send(result)
})
app.get('/biodata/user', async (req, res) => {
  const { email } = req.query; 
  
 

  const query = { contact_email: email }; 
  const result = await biodataCollection.find(query).toArray();
 res.send(result)
});

app.get('/biodata/:id', async (req, res) => {
  const id = req.params.id;
  console.log('Received ID:', id);
  const query = { _id: new ObjectId(id) };
    const result = await biodataCollection.findOne(query);
  res.send(result);
});



app.get('/success', async(req,res)=>{
    const result=await successCollection.find().toArray()
    res.send(result)
})
app.post('/success', async (req, res) => {
  const { selfBiodataId, partnerBiodataId, coupleImage, marriageDate, storyText, reviewStars } = req.body;

  
    const newSuccessStory = {
      selfBiodataId,
      partnerBiodataId,
      coupleImage,
      marriageDate,
      storyText,
      reviewStars,
      createdAt: new Date(), 
    };

    const result = await successCollection.insertOne(newSuccessStory);
   res.send(result)

});

app.get('/biodata/similar/:id', async (req, res) => {
  const id = req.params.id;
  const biodata = await biodataCollection.findOne({ _id: new ObjectId(id) });
  const { biodata_type } = biodata; 

  const similarBiodata = await biodataCollection
  .find({ biodata_type })  
  .limit(3)  
  .toArray();
  
res.send(similarBiodata);


})


app.post('/biodata', async (req, res) => {
  const newBio = req.body;

  const maxIdDoc = await biodataCollection.findOne({}, { sort: { bioId: -1 }, projection: { bioId: 1 } });
  const newId = maxIdDoc ? parseInt(maxIdDoc.bioId) + 1 : 1; 

  newBio.bioId = newId; 

  const result = await biodataCollection.insertOne(newBio);
  res.send(result)
});



// Update biodata by ID
app.put('/biodata/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  const result = await biodataCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );

  res.send(result);
});


app.post('/favorites', async (req, res) => {
  const { biodataId, userEmail, biodataDetails } = req.body;
  const newFavorite = {
    biodataId,
    userEmail,
    ...biodataDetails, 
  };
  const result = await favoritebiodata.insertOne(newFavorite);
res.send(result)

  
})

app.get('/favorites/user', async (req, res) => {
  const { email } = req.query; 
  console.log('Received email:', email);
 

  const query = { userEmail: email }; 
  const result = await favoritebiodata.find(query).toArray();
 res.send(result)
});


app.delete('/favorites/delete/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Deleting biodata with ID:', id);


    const result = await favoritebiodata.deleteOne({ _id: new ObjectId(id) });

   res.send(result)
});


app.get('/successCounter', async (req, res) => {

 const totalBiodata = await biodataCollection.countDocuments(); 
 const totalGirls = await biodataCollection.countDocuments({ biodata_type: 'Female' }); 
 const totalBoys = await biodataCollection.countDocuments({ biodata_type: 'Male' }); 
 const totalPremium = await biodataCollection.countDocuments({ member_type: 'Premium' }); 

 const totalMarriages = await successCollection.countDocuments({ marriageStatus: 'Completed' }); 

 res.json({
 totalBiodata,
 totalGirls,
 totalBoys,
 totalMarriages,
 totalPremium
 });

 });

// Fetch user by email
// app.get('/users/:email', async (req, res) => {
//   const email = req.params.email;
//   const user = await userCollection.findOne({ email });
// res.send(user)
// });

// app.get('/users', async(req,res)=>{
//   const result=await userCollection.find().toArray()
//   res.send(result)
// })


app.get('/users', async (req, res) => {
 
    const users = await userCollection.find().toArray(); // Fetch all users
    res.send(users);
 
});

app.get('/users/:email', async (req, res) => {
  const email = req.params.email;
  const result = await userCollection.findOne({ email });
  res.send(result)
});


 app.post('/users', async(req,res)=>{
  const { email, role = 'user', member_type = 'normal', displayName} = req.body;
  const existingUser = await userCollection.findOne({ email });
  if (existingUser) {
    return;
}

const newUser = { email, role, member_type, displayName};
   const result= await userCollection.insertOne(newUser);
   res.send(result)
 })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req,res)=>{
    res.send('Bia Said')
})
app.listen(port, ()=>{
    console.log(`Wedding is on ${port}`)
})