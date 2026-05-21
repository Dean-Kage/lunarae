# ⚖ Lunarae — ZIMRA Automated Bill of Entry AI

Lunarae auto-classifies goods, calculates customs duties, checks SI compliance,
and generates ZIMRA Bills of Entry (CF21 format) from invoice and shipping documents.

**Powered by:** Anthropic Claude · SI 122/2017 · SI 35/2024 · Zimbabwe Tariff Book

---

## Project Structure

```
lunarae/
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Root component
│   └── pages/
│       └── LunaraeBOE.jsx    # Main BOE application (Phase 3)
├── server/
│   ├── index.js              # Express API server (keeps API key secure)
│   └── package.json
├── data/
│   └── lunarae_knowledge_base.json   # 6,731 HS codes + SI rules
├── public/
│   └── favicon.svg
├── .env.example              # Copy this to .env and add your API key
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## Setup Instructions

### Step 1 — Prerequisites

Make sure these are installed on your machine:

| Tool    | Version  | Download                        |
|---------|----------|---------------------------------|
| Node.js | v18+     | https://nodejs.org              |
| Git     | any      | https://git-scm.com             |
| VS Code | any      | https://code.visualstudio.com   |

Check versions in your terminal:
```bash
node --version   # should show v18.x.x or higher
npm --version    # should show 9.x or higher
```

---

### Step 2 — Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Click **API Keys** in the left sidebar
4. Click **Create Key** — name it "Lunarae"
5. Copy the key (starts with `sk-ant-...`) — you only see it once

---

### Step 3 — Open the Project in VS Code

1. Unzip the `lunarae.zip` file you downloaded
2. Open VS Code
3. Go to **File → Open Folder**
4. Select the `lunarae` folder
5. VS Code will open the project

---

### Step 4 — Create Your .env File

In VS Code, open the **Terminal** (`` Ctrl+` `` or **Terminal → New Terminal**).

```bash
# Copy the example env file
cp .env.example .env
```

Now open `.env` in VS Code and replace the placeholder with your real API key:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
PORT=4000
```

**Important:** Never share this file or commit it to Git. It's already in `.gitignore`.

---

### Step 5 — Install Frontend Dependencies

In the VS Code terminal (make sure you are in the `lunarae` folder):

```bash
npm install
```

This installs React, Vite, jsPDF and other frontend packages. Takes about 1 minute.

---

### Step 6 — Install Server Dependencies

```bash
cd server
npm install
cd ..
```

This installs Express, Axios, dotenv for the API server.

---

### Step 7 — Run Lunarae

You need **two terminals** running at the same time.

**Terminal 1 — API Server:**
```bash
node server/index.js
```
You should see:
```
⚖  Lunarae API server running on http://localhost:4000
   API key loaded: ✓ YES
   Health check:   http://localhost:4000/api/health
```

**Terminal 2 — React Frontend:**
```bash
npm run dev
```
You should see:
```
  VITE v5.x  ready in 500ms
  ➜  Local:   http://localhost:3000/
```

Now open your browser and go to: **http://localhost:3000**

---

### Shortcut — Run Both at Once

Instead of two terminals, you can run both together:
```bash
npm run start
```

---

## How to Use Lunarae

1. **Set entry parameters** (left sidebar):
   - Entry Type: Home Consumption / Transit / Warehousing / etc.
   - Mode of Transport: Road / Air / Sea / Rail
   - Port of Entry: Beitbridge / Forbes / Chirundu / etc.
   - RBZ Rate: current ZWG per USD rate

2. **Add your shipping documents** (one of three ways):
   - Drag and drop a PDF invoice/packing list into the upload area
   - Click the upload area to browse for a file
   - Paste document text directly into the text box

3. **Click "Generate BOE Analysis"**

4. Lunarae will:
   - Classify each good to its 8-digit HS code
   - Calculate customs duty + VAT (14.5%) per line item
   - Check SI 122/2017 import licence requirements
   - Check SI 35/2024 CBCA Certificate of Conformity requirements
   - Flag any prohibited goods
   - Generate compliance alerts with specific actions

5. **Click "Download ZIMRA BOE PDF"** to get the completed CF21 form

---

## Supported Input Documents

| Document              | Format        |
|-----------------------|---------------|
| Commercial Invoice    | PDF, TXT      |
| Packing List          | PDF, TXT      |
| Air Waybill (AWB)     | PDF, TXT      |
| Road Manifest (CMR)   | PDF, TXT      |
| Bill of Lading        | PDF, TXT      |
| Combined documents    | Paste as text |

---

## Duty Calculation Formula

```
CIF Value       = FOB + Freight + Insurance
Customs Duty    = CIF Value × Duty Rate %
VAT Base        = CIF Value + Customs Duty
VAT             = VAT Base × 14.5%
Total Payable   = Customs Duty + VAT
Total (ZWG)     = Total Payable (USD) × RBZ Rate
```

---

## SI Compliance Rules Built In

| SI                | Coverage                                              |
|-------------------|-------------------------------------------------------|
| SI 122 of 2017    | 53 import licence categories + 4 export categories    |
| SI 35 of 2024     | CBCA (vehicles always; other goods if FOB > USD 1,000)|

---

## VS Code Extensions (Recommended)

Install these from the VS Code Extensions panel (`Ctrl+Shift+X`):

- **ES7+ React/Redux/React-Native snippets** — React shortcuts
- **Prettier** — auto-format code
- **DotENV** — syntax highlighting for .env files
- **Thunder Client** — test your API server endpoints

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ANTHROPIC_API_KEY not set` | Check your `.env` file has the key and no spaces around `=` |
| Port 3000 already in use | Change port in `vite.config.js`: `port: 3001` |
| Port 4000 already in use | Change in `.env`: `PORT=4001` and in `vite.config.js` proxy target |
| `npm install` fails | Make sure Node.js v18+ is installed: `node --version` |
| PDF not downloading | Allow popups in your browser for localhost |
| API error 401 | Your API key is wrong or expired — get a new one from console.anthropic.com |

---

## Next Steps (Phase 4)

- [ ] User login system (multiple clearing agents)
- [ ] Shipment history and search
- [ ] Client management
- [ ] Direct ZIMRA ASYCUDA integration
- [ ] Electron desktop app wrapper for offline use at ports

---

*Lunarae v1.0 — Built with Anthropic Claude · Zimbabwe 2025*
