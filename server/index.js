/**
 * Lunarae — Express API Server
 * ────────────────────────────
 * Run:  node server/index.js   (or wherever you place this)
 * Port: 4000
 */

const express  = require('express')
const cors     = require('cors')
const axios    = require('axios')
const multer   = require('multer')
const fs       = require('fs')
const path     = require('path')
const pdfParse = require('pdf-parse')
const mammoth  = require('mammoth')
require('dotenv').config({ path: __dirname + '/../.env' })

const app  = express()
const PORT = process.env.PORT || 4000

// ── Multer – temp upload folder ───────────────────────────────────────────
const upload = multer({ dest: path.join(__dirname, '../uploads/') })

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json({ limit: '20mb' }))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Lunarae API Server',
    version: '2.0.0',
    openrouter_key_set: !!process.env.OPENROUTER_API_KEY,
  })
})

// ── File extraction endpoint ──────────────────────────────────────────────
app.post('/api/extract', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const { mimetype, path: filePath, originalname } = req.file
  let text = ''

  try {

    if (mimetype === 'application/pdf') {
      // ── PDF ──────────────────────────────────────────────────────────
      //const pdfParse = require('pdf-parse').default || require('pdf-parse')
      const dataBuffer = fs.readFileSync(filePath)
      const data = await pdfParse(dataBuffer)
      text = data.text

    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.toLowerCase().endsWith('.docx')
    ) {
      // ── Word .docx ────────────────────────────────────────────────────
      //const mammoth = require('mammoth')
      const result  = await mammoth.extractRawText({ path: filePath })
      text = result.value

    } else if (
      mimetype === 'text/plain'    ||
      mimetype === 'text/csv'      ||
      mimetype === 'application/xml' ||
      mimetype === 'text/xml'      ||
      originalname.toLowerCase().endsWith('.txt')  ||
      originalname.toLowerCase().endsWith('.csv')  ||
      originalname.toLowerCase().endsWith('.xml')
    ) {
      // ── Plain text / CSV / XML ────────────────────────────────────────
      text = fs.readFileSync(filePath, 'utf8')

    } else {
      // ── Unsupported type ──────────────────────────────────────────────
      fs.unlinkSync(filePath)
      return res.json({
        text: '',
        warning: `File type "${mimetype}" is not supported. Supported: PDF, DOCX, TXT, CSV, XML. Please paste the text manually.`
      })
    }

    // Clean up temp file
    fs.unlinkSync(filePath)

    // Sanity check – did we actually get text?
    if (!text || text.trim().length < 10) {
      return res.json({
        text: '',
        warning: 'Could not extract readable text. The file may be a scanned image PDF. Please paste the invoice text manually.'
      })
    }

    console.log(`Extracted ${text.length} chars from ${originalname}`)
    return res.json({ text: text.trim(), filename: originalname })

  } catch (err) {
    // Clean up on error
    try { fs.unlinkSync(filePath) } catch {}
    console.error('Extraction error:', err.message)
    return res.status(500).json({ error: 'Failed to extract text: ' + err.message })
  }
})

// ── Claude / OpenRouter proxy ─────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Forwarding request to OpenRouter…')

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: req.body.system },
          ...req.body.messages
        ],
        temperature: 0.1,
        max_tokens:  12000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  'http://localhost:3000',
          'X-Title':       'Lunarae'
        },
        timeout: 120000
      }
    )

    const content = response.data.choices[0].message.content
    console.log('OpenRouter response received ✓')

    // Return in Anthropic-compatible shape so the frontend works unchanged
    return res.json({ content: [{ text: content }] })

  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message)
    return res.status(500).json({
      error: err.response?.data || err.message
    })
  }
})

// ── Catch-all ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
})

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚖  Lunarae API server running on http://localhost:${PORT}`)
  console.log(`   OpenRouter key: ${process.env.OPENROUTER_API_KEY ? '✓ loaded' : '✗ MISSING – check .env'}`)
  console.log(`   Health:  GET  http://localhost:${PORT}/api/health`)
  console.log(`   Extract: POST http://localhost:${PORT}/api/extract`)
  console.log(`   Claude:  POST http://localhost:${PORT}/api/claude\n`)
})