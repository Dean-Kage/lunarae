/**
 * Lunarae — Express API Server
 * ────────────────────────────
 * Keeps your Anthropic API key secure on the server.
 * The React frontend calls /api/claude which this server
 * forwards to Anthropic with your API key attached.
 *
 * Run:  node server/index.js
 * Port: 4000
 */

const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config({ path: __dirname + '/../.env' })

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json({ limit: '20mb' }))   // large enough for PDF base64

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Lunarae API Server',
    version: '1.0.0',
    api_key_set: !!process.env.ANTHROPIC_API_KEY,
  })
})

// ── Claude proxy ──────────────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  try {

    console.log('Processing OpenRouter request...')

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',

        messages: [
          {
            role: 'system',
            content: req.body.system
          },

          ...req.body.messages
        ],

        temperature: 0.1,
        max_tokens: 12000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Lunarae'
        },

        timeout: 120000
      }
    )

    const content =
      response.data.choices[0].message.content

    console.log('OpenRouter response received')

    res.json({
      content: [
        {
          text: content
        }
      ]
    })

  } catch (err) {

    console.error('OPENROUTER ERROR')

    if (err.response) {
      console.error(err.response.data)
    } else {
      console.error(err.message)
    }

    res.status(500).json({
      error:
        err.response?.data ||
        err.message
    })
  }
})

// ── Catch-all for undefined routes ─────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n⚖  Lunarae API server running on http://localhost:${PORT}`)
  console.log(`   OpenRouter key loaded: ${!!process.env.OPENROUTER_API_KEY ? '✓ YES' : '✗ NO — add to .env'}`)
  console.log(`   Health check:   http://localhost:${PORT}/api/health`)
  console.log(`   Claude endpoint: POST http://localhost:${PORT}/api/claude\n`)
})