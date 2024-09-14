const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
            const data = product.find();
            const result = await data.toArray();
            res.send(result);
        });

        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const result = await product.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // User Routes
        app.get("/user", async (req, res) => {
            const data = user.find();
            const result = await data.toArray();
            res.send(result);
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

        app.post("/create-payment-intent", async (req, res) => {
            try {
                const { items, totalAmount } = req.body;

                if (!items || !totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
                    return res.status(400).json({ error: 'Invalid input' });
                }

                const amount = totalAmount * 100; // Convert to cents

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card'],
                });

                res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
            } catch (error) {
                console.error('Error creating payment intent:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.post("/payment", async (req, res) => {
            const data = req.body;

            if (!data || !data.paymentIntentId || !data.customerEmail || !Array.isArray(data.items) || !data.totalAmount) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Save payment details to the database
            const result = await payment.insertOne({
                ...data,
                createdAt: new Date(),
            });

            res.send(result);
        });

        console.log("Connected to MongoDB!");

    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
