const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
const port = Number(process.env.PORT) || 5000
const companies = ['Vibro', 'HCL', 'TCS', 'Infosys', 'Wipro', 'Zoho', 'Cognizant', 'Accenture', 'Tech Mahindra', 'Capgemini']
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const years = ['1st year', '2nd year', '3rd year', '4th year']

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  studentId: { type: String, required: true, trim: true, unique: true, maxlength: 40 },
  department: { type: String, required: true, trim: true, maxlength: 100 },
  year: { type: String, required: true, enum: years },
  section: { type: String, required: true, trim: true, maxlength: 20 },
  bloodGroup: { type: String, required: true, enum: bloodGroups },
  fatherName: { type: String, required: true, trim: true, maxlength: 120 },
  motherName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  arrears: { type: Number, required: true, min: 0, max: 0 },
  companies: {
    type: [{ type: String, enum: companies }],
    required: true,
    validate: {
      validator: (selected) => selected.length === 4 && new Set(selected).size === 4,
      message: 'Choose exactly four different companies.',
    },
  },
}, { timestamps: true })

const Student = mongoose.model('Student', studentSchema)

app.use(express.json({ limit: '20kb' }))

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

app.get('/api/registrations', async (request, response, next) => {
  try {
    const { company } = request.query
    if (company && !companies.includes(company)) {
      return response.status(400).json({ error: 'Select a valid company filter.' })
    }
    const filter = company ? { companies: company } : {}
    const students = await Student.find(filter)
      .select('name studentId department year section arrears companies email')
      .sort({ name: 1 })
      .lean()
    return response.json({ students })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/registrations/login', async (request, response, next) => {
  try {
    const studentId = typeof request.body?.studentId === 'string' ? request.body.studentId.trim() : ''
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
    if (!studentId || !email) {
      return response.status(400).json({ error: 'Enter your student ID and registered email address.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: 'Enter a valid email address.' })
    }

    const student = await Student.findOne({ studentId, email })
      .select('name studentId department year section companies createdAt')
      .lean()
    if (!student) {
      return response.status(401).json({ error: 'No registration matches that student ID and email.' })
    }
    return response.json({ student })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/registrations', async (request, response, next) => {
  try {
    const body = request.body || {}
    const textFields = ['name', 'studentId', 'department', 'year', 'section', 'bloodGroup', 'fatherName', 'motherName', 'email']
    const student = {}

    for (const field of textFields) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        return response.status(400).json({ error: `${field} is required.` })
      }
      student[field] = body[field].trim()
    }

    student.email = student.email.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      return response.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (!years.includes(student.year)) {
      return response.status(400).json({ error: 'Select a valid academic year.' })
    }
    if (!bloodGroups.includes(student.bloodGroup)) {
      return response.status(400).json({ error: 'Select a valid blood group.' })
    }

    const arrears = body.arrears
    if ((typeof arrears !== 'number' && typeof arrears !== 'string') || String(arrears).trim() === '' || !Number.isInteger(Number(arrears)) || Number(arrears) < 0) {
      return response.status(400).json({ error: 'Standing arrears must be a non-negative whole number.' })
    }
    if (Number(arrears) !== 0) {
      return response.status(422).json({ error: 'Students must have zero standing arrears to register.' })
    }

    if (!Array.isArray(body.companies) || body.companies.length !== 4 || new Set(body.companies).size !== 4 || body.companies.some((company) => !companies.includes(company))) {
      return response.status(400).json({ error: 'Choose exactly four different companies from the list.' })
    }

    student.arrears = 0
    student.companies = body.companies
    const registration = await Student.create(student)
    return response.status(201).json({ message: 'Registration submitted and saved successfully.', student: registration })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ error: 'A registration already exists for this student ID.' })
    }
    return next(error)
  }
})

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error)
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' })
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return response.status(400).json({ error: 'Registration data is invalid.' })
  }
  console.error(`API request failed: ${error.name || 'Error'}`)
  return response.status(500).json({ error: 'The server could not complete this request.' })
})

async function startServer() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required')
  await mongoose.connect(process.env.MONGO_URI)
  app.listen(port, () => console.log(`Placement API listening on port ${port}`))
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Could not start the placement API: ${error.name || 'Error'}`)
    process.exit(1)
  })
}

module.exports = { app, Student, startServer }