const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // Import ObjectId from mongodb

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB setup
const uri = "mongodb+srv://Raj1234:usrkhCiHVUWLjVLH@giftdelivery.5tdul.mongodb.net/?retryWrites=true&w=majority&appName=giftdelivery";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let userCollection;
let orderCollection;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db("giftdelivery");
    userCollection = db.collection("users");
    orderCollection = db.collection("orders");  // Connect to the orders collection

    // Dummy user data with ObjectId
    const dummyUser = {
      email: "admin@domain.com",
      firstName: "CQU",
      lastName: "User",
      phoneNumber: "0422919919",
      state: "QLD",
      postcode: "4702",
      address: "700 Yamba Road",
      password: "admin"
    };

    // Dummy order data
    const dummyOrder = {
      distributor: "Santa Claus",
      firstName: "Fiona",
      lastName: "Johnston",
      state: "ACT",
      phoneNumber: "0422888333",
      address: "31 McDonald Way",
      postcode: "4611",
      date: "2024-06-05",
      itemName: "Flowers",
      itemPrice: "$16",
      itemImage: "img/flowers.png",
      customerEmail: "admin@domain.com",
      orderNo: "684675"
    };

    // Check if the dummy user exists, if not, insert it
    const existingUser = await userCollection.findOne({ email: dummyUser.email });
    if (!existingUser) {
      await userCollection.insertOne(dummyUser);
      console.log('Dummy user data inserted successfully into users collection');
    } else {
      console.log('Dummy user already exists in the database, skipping insertion');
    }

    // Check if the dummy order exists, if not, insert it
    const existingOrder = await orderCollection.findOne({ orderNo: dummyOrder.orderNo });
    if (!existingOrder) {
      await orderCollection.insertOne(dummyOrder);
      console.log('Dummy order data inserted successfully into orders collection');
    } else {
      console.log('Dummy order already exists in the database, skipping insertion');
    }

  } catch (err) {
    console.error('Error connecting to MongoDB or inserting data:', err);
    process.exit(1);
  }
}

connectToMongoDB(); // Call the function to connect and insert data

// Routes
app.get('/', (req, res) => {
  res.send('<h3>Welcome to Gift Delivery server app!</h3>');
});

app.get('/getUserDataTest', async (req, res) => {
  try {
    console.log("GET request received\n");
    const docs = await userCollection.find({}, { projection: { _id: 0 } }).toArray();
    console.log(JSON.stringify(docs) + " have been retrieved.\n");
    res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
  } catch (err) {
    console.log("Some error.. " + err + "\n");
    res.status(500).send(err);
  }
});

app.get('/getOrderDataTest', async (req, res) => {
  try {
    console.log("GET request received\n");
    const docs = await orderCollection.find({}, { projection: { _id: 0 } }).toArray();
    console.log(JSON.stringify(docs) + " have been retrieved.\n");
    res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
  } catch (err) {
    console.log("Some error.. " + err + "\n");
    res.status(500).send(err);
  }
});

app.post('/verifyUser', async (req, res) => {
  try {
    console.log("POST request received : " + JSON.stringify(req.body) + "\n");
    const loginData = req.body;
    const docs = await userCollection.find({ email: loginData.email, password: loginData.password }, { projection: { _id: 0 } }).toArray();
    console.log(JSON.stringify(docs) + " have been retrieved.\n");
    res.status(200).send(docs);
  } catch (err) {
    console.log("Some error.. " + err + "\n");
    res.status(500).send(err);
  }
});

app.get('/getAllUsers', async (req, res) => {
	try {
	  const users = await userCollection.find({}, { projection: { email: 1, password: 1, _id: 0 } }).toArray();
	  console.log("All Users: ", users);
	  res.status(200).json(users);
	} catch (err) {
	  console.error('Error retrieving users:', err);
	  res.status(500).send("Failed to retrieve users.");
	}
});

app.post('/postOrderData', async (req, res) => {
  try {
    console.log("POST request received : " + JSON.stringify(req.body) + "\n");
    const result = await orderCollection.insertOne(req.body);
    console.log("Order record with ID " + result.insertedId + " has been inserted\n");
    res.status(200).send(result);
  } catch (err) {
    console.log("Some error.. " + err + "\n");
    res.status(500).send(err);
  }
});

app.post('/signup', async (req, res) => {
    try {
        const { email, password, firstName, lastName, state, phone, address, postcode } = req.body;
        
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'Email already exists' });
        }

        const newUser = {
            email,
            password,
            firstName,
            lastName,
            state,
            phone,
            address,
            postcode
        };
        const result = await userCollection.insertOne(newUser);

        console.log(`New user created with ID: ${result.insertedId}`);
        res.status(201).send({ message: 'User registered successfully' });
		const insertedUser = await userCollection.findOne({ _id: result.insertedId });
        console.log("Inserted user: ", insertedUser);
    } catch (error) {
        console.error("Error during signup: ", error);
        res.status(500).send({ error: 'An error occurred during signup' });
    }
});
// Retrieve orders for the currently logged-in user
app.post('/getUserOrders', async (req, res) => {
  try {
    const { email } = req.body; // Get the user's email from the request body
    console.log(`POST request received for user orders: ${email}\n`);

    // Fetch orders from the collection for the current user
    const orders = await orderCollection.find({ customerEmail: email }).toArray();

    if (orders.length > 0) {
      console.log(`Orders retrieved for ${email}:`, orders);
      res.status(200).json(orders); // Send orders back to the client
    } else {
      console.log(`No orders found for ${email}`);
      res.status(404).send({ message: "No orders found" });
    }
  } catch (err) {
    console.log(`Error retrieving orders for user ${email}:`, err);
    res.status(500).send(err);
  }
});
app.delete('/deleteOrders', async (req, res) => {
  try {
    const { orderIds } = req.body; // Array of order IDs to be deleted
    console.log("DELETE request received for order IDs: ", orderIds);

    // Convert each string ID to ObjectId
    const objectIds = orderIds.map(id => new ObjectId(id));

    // Delete orders from the database where the _id is in the array of order IDs
    const result = await orderCollection.deleteMany({ _id: { $in: objectIds } });

    console.log(`${result.deletedCount} orders deleted.`);
    res.status(200).json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Error deleting orders: ", err);
    res.status(500).send({ error: "An error occurred while deleting orders." });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Gift Delivery server app listening at http://localhost:${port}`);
});