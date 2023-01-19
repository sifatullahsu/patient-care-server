const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const cluster = process.env.DB_CLUSTER;


const uri = `mongodb+srv://${user}:${pass}@${cluster}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const run = async () => {
  try {
    const db = client.db('patient-care');
    const patientCollection = db.collection('patient');

    app.get('/v1/patient/list', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 10;
      const skip = (page - 1) * size;

      const query = {}
      const cursor = patientCollection.find(query).sort({ _id: -1 });
      const patient = await cursor.skip(skip).limit(size).toArray();

      const totalRecord = await patientCollection.estimatedDocumentCount();
      const total = Math.ceil(totalRecord / size);

      const data = {
        status: true,
        data: patient,
        pagination: {
          total,
          current: page,
        }
      }

      res.send(data);
    });


    app.get('/v1/patient/single/:id', async (req, res) => {
      const id = req.params.id;

      let patient = null;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) }
        patient = await patientCollection.findOne(query);
      }

      const result = patient ? {
        status: true,
        data: patient
      } : {
        status: false,
        message: 'Data not found.'
      }

      res.send(result);
    });


    app.post('/v1/patient/create', async (req, res) => {
      const data = req.body;
      const response = await patientCollection.insertOne(data);

      const result = response?.acknowledged ? {
        status: true,
        _id: response.insertedId,
        message: 'Data create successful.'
      } : {
        status: false,
        message: 'Something is wrong.'
      }

      res.send(result);
    });


    app.patch('/v1/patient/update/:id', async (req, res) => {
      const id = req.params.id;
      const updateObject = req.body;

      let response = null;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) }
        const updatedDoc = {
          $set: updateObject
        }

        response = await patientCollection.updateOne(query, updatedDoc);
      }

      const result = response?.acknowledged ? {
        status: true,
        message: 'Update successful.'
      } : {
        status: false,
        message: 'Invalid id.'
      }

      res.send(result);
    });


    app.delete('/v1/patient/delete/:id', async (req, res) => {
      const id = req.params.id;

      let response = null;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) };
        response = await patientCollection.deleteOne(query);
      }

      const result = response?.deletedCount ? {
        status: true,
        message: 'Delete successful.'
      } : {
        status: false,
        message: 'Delete unsuccessful.'
      }

      res.send(result);
    })
  }
  finally {

  }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
  res.send({ message: 'The server is Running...' });
});

app.listen(port, () => {
  console.log(`The server running on ${port}`);
});