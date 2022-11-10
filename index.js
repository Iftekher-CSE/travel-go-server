const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

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

function verifyJWT(req, res, next) {
    const headerTokenJWT = req.headers.authorization;
    if (!headerTokenJWT) {
        return res.status(401).send({ message: "unauthorized access(no-jwt)" });
    }
    const token = headerTokenJWT.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(403)
                .send({ message: "forbidden access(jwt-match)" });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    const serviceCollection = client
        .db("travelGo")
        .collection("serviceCollection");

    const reviewCollection = client
        .db("travelGo")
        .collection("reviewCollection");
    try {
        // create and sent jwt token
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h",
            });
            res.send({ token });
        });

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

        // get all review based on service
        app.get("/serviceReview", async (req, res) => {
            const serviceId = req.query.serviceId;
            const query = { serviceId: serviceId };
            const sort = { reviewTime: -1 };
            const cursor = reviewCollection.find(query).sort(sort);
            const allReviews = await cursor.toArray();
            res.send(allReviews);
        });

        // get all review with query
        app.get("/allReview", verifyJWT, async (req, res) => {
            // verify email based on JWT
            const decoded = req.decoded;
            const email = req.query.email;
            if (decoded.email !== email) {
                return res
                    .status(403)
                    .send({ message: "forbidden access(email-match)" });
            }
            const serviceId = req.query.serviceId;
            const query = {
                $or: [{ serviceId: serviceId }, { email: email }],
            };
            const sort = { reviewTime: -1 };
            const cursor = reviewCollection.find(query).sort(sort);
            const allReviews = await cursor.toArray();
            res.send(allReviews);
        });

        // update a review
        app.patch("/allReview/:id", async (req, res) => {
            const id = req.params.id;
            const newReview = req.body.review;
            const filter = { _id: ObjectId(id) };
            const updatedReview = {
                $set: { review: newReview },
            };
            const result = await reviewCollection.updateOne(
                filter,
                updatedReview
            );
            console.log(result);
            res.send(result, id, newReview);
        });

        // Delete a review
        app.delete("/allReview/:id", async (req, res) => {
            const id = req.params.id;
            const result = await reviewCollection.deleteOne({
                _id: ObjectId(id),
            });
            res.send(result);
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
