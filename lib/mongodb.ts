import { MongoClient, Db } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGO_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local as MONGO_URI");
}

if (process.env.NODE_ENV === "development") {
    // In development, use a global variable to preserve connection across hot reloads
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production, create a new client
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
    const client = await clientPromise;
    return client.db("raffle_bot");
}
