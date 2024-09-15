const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_4eC39HqLyjWDarjtT1zdp7dc');  // Use environment variable for Stripe secret
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Token Functions
const createToken = (user) => jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET, // Use environment variable for secret
    { expiresIn: "7d" }
);

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized" });
        req.user = decoded.email;
        next();
    });
};

// MongoDB Connection
const client = new MongoClient(process.env.URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const run = async () => {
    try {
        await client.connect();
        const database = client.db("mononest");
        const productCollection = database.collection("products");
        const userCollection = database.collection("user");
        const paymentsCollection = database.collection("order_history");

        // Product Routes
        app.get("/product", async (req, res) => {
            try {
                const products = await productCollection.find().toArray();
                res.json(products);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.get("/product/:id", async (req, res) => {
            try {
                const product = await productCollection.findOne({ _id: new ObjectId(req.params.id) });
                res.json(product);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // User Routes
        app.get("/user", async (req, res) => {
            try {
                const users = await userCollection.find().toArray();
                res.json(users);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.post("/user", async (req, res) => {
            try {
                const userData = req.body;
                const existingUser = await userCollection.findOne({ email: userData.email });

                const token = createToken(userData);
                if (existingUser) return res.json({ token });

                await userCollection.insertOne(userData);
                res.json({ token });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.get("/user/:email", async (req, res) => {
            try {
                const user = await userCollection.findOne({ email: req.params.email });
                res.json(user);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.patch("/user/:email", verifyToken, async (req, res) => {
            try {
                const result = await userCollection.updateOne(
                    { email: req.params.email },
                    { $set: req.body },
                    { upsert: true }
                );
                res.json(result);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // Payment Routes
        app.get("/payment", async (req, res) => {
            try {
                const payments = await paymentsCollection.find().toArray();
                res.json(payments);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
          
            if (!price || typeof price !== 'number') {
              return res.status(400).json({ error: 'Invalid price' });
            }
          
            // Convert price to cents and round it to avoid floating-point errors
            const amountInCents = Math.round(price * 100);
          
            try {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents, // Amount in cents
                currency: 'usd',
              });
          
              res.json({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
              console.error('Error creating payment intent:', error.message);
              res.status(500).json({ error: 'Failed to create payment intent' });
            }
          });
          


        app.post('/payment', async (req, res) => {
            try {
                const { paymentIntentId, customerEmail, items, totalAmount, customerNumber, customerAddress } = req.body;

                // Validate required fields
                if (!paymentIntentId || !customerEmail || !items || !totalAmount || !customerNumber || !customerAddress) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const paymentData = {
                    paymentIntentId,
                    customerEmail,
                    items,
                    totalAmount,
                    createdAt: new Date(),
                    customerNumber,
                    customerAddress
                };

                const result = await paymentsCollection.insertOne(paymentData);
                res.status(200).json(result);
            } catch (error) {
                console.error('Error processing payment:', error.message);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
};

run().catch(console.error);

app.get('/', (req, res) => res.send('Server is running'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
