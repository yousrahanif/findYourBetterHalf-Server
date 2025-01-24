const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app=express()
const port = process.env.PORT || 5000

app.use(cors())

app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



let totalRevenue = 0;



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
const paymentCollection=client.db('metrimonyDb').collection('payments')
const primesCollection=client.db('metrimonyDb').collection('primes')
// app.get('/biodata', async(req,res)=>{
//     const result=await biodataCollection.find().toArray()
//     res.send(result)
// })

app.get('/biodata', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;
  const result = await biodataCollection.find().skip(skip).limit(limit).toArray();

  const totalCount = await biodataCollection.countDocuments();
  res.send({ result, totalCount });
});

app.get('/biodata/user', async (req, res) => {
  const { email } = req.query; 
  
 

  const query = { contact_email: email }; 
  const result = await biodataCollection.find(query).toArray();
 res.send(result)
});

app.get('/biodata/:id', async (req, res) => {
  const id = req.params.id;
 
  const query = { _id: new ObjectId(id) };
    const result = await biodataCollection.findOne(query);
  res.send(result);
});



app.post('/biodata/makePremium', async (req, res) => {
  const { email } = req.body;

  const result = await primesCollection.insertOne({
 
    email
  });
   res.send(result)
});

app.get('/premiumCollection', async(req,res)=>{
  const result=await primesCollection.find().toArray()
  res.send(result)
})


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


    const result = await favoritebiodata.deleteOne({ _id: new ObjectId(id) });

   res.send(result)
});


app.get('/successCounter', async (req, res) => {

 const totalBiodata = await biodataCollection.countDocuments(); 
 const totalGirls = await biodataCollection.countDocuments({ biodata_type: 'Female' }); 
 const totalBoys = await biodataCollection.countDocuments({ biodata_type: 'Male' }); 
 const totalPremium = await userCollection.countDocuments({ member_type: 'premium' }); 

 const totalMarriages = await successCollection.countDocuments();
 const paymentCount = await paymentCollection.countDocuments();
 const totalRevenue = paymentCount * 5;
 res.json({
 totalBiodata,
 totalGirls,
 totalBoys,
 totalMarriages,
 totalPremium,
 totalRevenue
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
 
    const users = await userCollection.find().toArray(); 
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



 app.patch('/users/update-membership/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

 
    const result = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );

    res.send(result);
  
});

app.get('/payments', async(req,res)=>{
  const result=await paymentCollection.find().toArray()
  res.send(result)
})


app.post("/api/payment", async (req, res) => {
  const { cardNumber, email, biodataId } = req.body;

  const isValidCardNumber = /^\d{13,19}$/.test(cardNumber);

  if (isValidCardNumber) {
    // const existingPayment = await paymentCollection.findOne({ biodataId });
    const existingPayment = await paymentCollection.findOne({ email });

    if (existingPayment) {
      return res.status(400).json({ message: "You Already Requested" });
    }

    const payment = {
      email,
      biodataId,
      cardNumber,
      date: new Date(),
      amount: 5,
    };

    paymentCollection.insertOne(payment)
      .then(() => {
        res.json({ message: "Payment successful!" });
      })
      .catch((error) => {
        res.status(500).json({ message: "Something went wrong!" });
      });
  } else {
    res.status(400).json({ message: "Invalid card number" });
  }
});


app.get("/api/revenue", async (req, res) => {
  paymentCollection.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
  ])
  .toArray()
  .then((revenue) => {
    const totalRevenue = revenue.length > 0 ? revenue[0].totalRevenue : 0;
    res.json({ totalRevenue });
  })
  
});


app.patch('/api/users/make-premium', async (req, res) => {
  const { email } = req.body;

    const result = await userCollection.updateOne(
      { email },
      { $set: { member_type: 'premium' } }
     
    );
    res.send(result)

  
});

// app.patch('/api/biodata/make-premium', async (req, res) => {
//   const { email } = req.body;

//     const result = await biodataCollection.updateOne(
//       { email },
//       { $set: { member_type: 'premium' } }
     
//     );
//     res.send(result)

  
// });

app.patch('/biodata/update-member-type', async (req, res) => {
  const { contact_email, member_type } = req.body;



    const result = await biodataCollection.updateMany(
      { contact_email }, 
      { $set: { member_type } } 
    );

    res.send(result)
});




//  app.post("/api/payment", (req, res) => {
//   const { cardNumber } = req.body;

//   const isValidCardNumber = /^\d{13,19}$/.test(cardNumber);

//   if (isValidCardNumber) {
//     totalRevenue += 5;
//     console.log(`Payment successful! Total revenue: $${totalRevenue}`);

//     // Send a success response
//     res.json({ totalRevenue: totalRevenue });
//     };
  
// });
// app.get("/api/revenue", (req, res) => {
//   res.json({ totalRevenue });
// });
//  app.post("/create-payment-intent", async (req, res) => {
  
//     const amount = 500; // $5.00 in cents
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount,
//       currency: "usd",
//       payment_method_types: ["card"],
//     });

//     res.send({
//       clientSecret: paymentIntent.client_secret,
//     });
 
// });


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