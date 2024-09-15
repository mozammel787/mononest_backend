const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// JWT Token Functions
function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email,
        },
        process.env.JWT_SECRET, // Use environment variable for secret
        { expiresIn: "7d" }
    );
    return token;
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Unauthorized");

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send("Unauthorized");
        req.user = decoded.email;
        next();
    });
}

// MongoDB Connection
const client = new MongoClient(process.env.URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        const database = client.db("mononest");
        const product = database.collection("products");
        const user = database.collection("user");
        const payment = database.collection("order_history");

        // Product Routes
        app.get("/product", async (req, res) => {
            try {
                const data = product.find();
                const result = await data.toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.get("/product/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await product.findOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // User Routes
        app.get("/user", async (req, res) => {
            try {
                const data = user.find();
                const result = await data.toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.post("/user", async (req, res) => {
            const data = req.body;
            const token = createToken(data);
            const existingUser = await user.findOne({ email: data?.email });
            if (existingUser) {
                return res.send({ token });
            }
            await user.insertOne(data);
            res.send({ token });
        });

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const result = await user.findOne({ email });
            res.send(result);
        });

        app.patch("/user/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const updateData = req.body;
            const result = await user.updateOne(
                { email },
                { $set: updateData },
                { upsert: true }
            );
            res.send(result);
        });

        // Payment Routes
        app.get("/payment", async (req, res) => {
            const data = payment.find();
            const result = await data.toArray();
            res.send(result);
        });

        // Create Payment Intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
      
            if (!price || typeof price !== 'number') {
              return res.status(400).json({ error: 'Invalid price' });
            }
      
            try {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: price * 100, // Amount in cents
                currency: 'usd',
              });
      
              res.json({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
              console.error('Error creating payment intent:', error.message);
              res.status(500).json({ error: 'Failed to create payment intent' });
            }
          });
      
          // Endpoint to handle successful payments
          app.post('/payment', async (req, res) => {
            const { paymentIntentId, customerEmail, items, totalAmount } = req.body;
      
            if (!paymentIntentId || !customerEmail || !items || !totalAmount) {
              return res.status(400).json({ error: 'Missing required fields' });
            }
      
            const paymentData = {
              paymentIntentId,
              customerEmail,
              items,
              totalAmount,
              createdAt: new Date(),
            };
      
            const result = await paymentsCollection.insertOne(paymentData);
            res.status(200).json(result);
          });

        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
