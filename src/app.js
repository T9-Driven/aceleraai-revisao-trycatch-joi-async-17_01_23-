import express from 'express'
import joi from 'joi'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;

const carsSchema = joi.object({
  name: joi.string().required(),
  model: joi.string().required(),
  year: joi.string().required(),
  price: joi.number().required()
})

const carsUpdateSchema = joi.object({
  name: joi.string(),
  model: joi.string(),
  year: joi.string(),
  price: joi.number()
})

try {
  await mongoClient.connect()
  db = mongoClient.db()
} catch (error) {
  console.log(error)
}

const app = express()
app.use(cors())
app.use(express.json())

app.get("/cars", async (req, res) => {
  try {
    const cars = await db.collection("cars").find().toArray()

    if (cars.lenght == 0) return res.sendStatus(404)

    res.send(cars)


  } catch (error) {
    res.sendStatus(500)
  }
})

app.post("/cars", async (req, res) => {
  const { name, model, year, price } = req.body

  const { error } = carsSchema.validate({ name, model, year, price }, { abortEarly: false })

  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return res.status(422).send(errorMessages)
  }

  try {

    const carExists = await db.collection("cars").findOne({ name })

    if (carExists) return res.sendStatus(409)

    await db.collection("cars").insertOne({ name, model, year, price })

    res.sendStatus(201)

  } catch (error) {
    res.sendStatus(500)
  }



})

app.put("/cars/:id", async (req, res) => {
  const id = req.params.id
  const body = req.body

  const { error } = carsUpdateSchema.validate(body)

  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return res.status(422).send(errorMessages)
  }

  try {

    await db.collection("cars").updateOne({ _id: ObjectId(id) }, { $set: { ...body } })

    res.sendStatus(200)

  } catch (error) {
    res.sendStatus(500)
  }

})

app.delete("/cars/:id", async (req, res) => {
  const id = req.params.id

  try {
    await db.collection("cars").deleteOne({ _id: ObjectId(id) })

    res.sendStatus(200)

  } catch (error) {
    res.sendStatus(500)
  }
})

app.listen(5006, () => console.log('Foi rodou suave!!'))