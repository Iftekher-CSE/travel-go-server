const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ia1gz29.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
async function run() {
    const serviceCollection = client
        .db("travelGo")
        .collection("serviceCollection");

    const reviewCollection = client
        .db("travelGo")
        .collection("reviewCollection");
    try {
        // get all service
        app.get("/allServices", async (req, res) => {
            const count = parseInt(req.query.count);
            const cursor = serviceCollection.find({});
            const allServices = await cursor.limit(count).toArray();
            res.send(allServices);
        });
        // get a service
        app.get("/serviceDetails/:id", async (req, res) => {
            const id = req.params.id;
            const serviceDetails = await serviceCollection.findOne({
                _id: ObjectId(id),
            });
            res.send(serviceDetails);
        });

        // post a service
        app.post("/addService", async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        // post a review
        app.post("/postReview", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // get all review with query
        app.get("/allReview", async (req, res) => {
            const serviceId = req.query.serviceId;
            const email = req.query.email;
            const query = {
                $or: [{ serviceId: serviceId }, { email: email }],
            };
            const sort = { reviewTime: -1 };
            const cursor = reviewCollection.find(query).sort(sort);
            const allReviews = await cursor.toArray();
            res.send(allReviews);
        });
    } finally {
    }
}

run().catch(err => console.error(err));

app.get("/", (req, res) => {
    res.send("travel go server is running");
});

app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});
