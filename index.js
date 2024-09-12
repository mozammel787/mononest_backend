const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());



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
        const order_history = database.collection("order_history");

        //   product

        app.get("/product", async (req, res) => {
            const data = product.find();
            const result = await data.toArray();
            // console.log(result);
            
            res.send(result);
        });

        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            
            const result = await product.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });


        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
    }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send('server is running')
  })
  app.listen(port, () => {
    console.log(`running port is ${port}`)
  })