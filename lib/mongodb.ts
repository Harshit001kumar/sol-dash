import { MongoClient, Db } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGO_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
    // During build time, we might not have the URI, so we shouldn't crash immediately.
    // Instead, we assign a rejected promise which will throw only if logic tries to use the DB.
    clientPromise = Promise.reject(new Error("Please add your MongoDB URI to .env.local as MONGO_URI"));
} else {
    if (process.env.NODE_ENV === "development") {
        if (!global._mongoClientPromise) {
            client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect();
        }
        clientPromise = global._mongoClientPromise;
    } else {
        client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
    const client = await clientPromise;
    return client.db("raffle_bot");
}
