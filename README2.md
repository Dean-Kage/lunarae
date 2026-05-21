cat > README.md << 'EOF'
# Lunarae - Zimbabwe Customs AI Bill of Entry System

Lunarae is an AI-powered customs declaration system that automatically processes shipping documents, classifies goods using HS codes, calculates duties and VAT, and generates ZIMRA-compliant Bill of Entry (CF21) and ASYCUDA XML files.

## Features

- 🤖 **AI-Powered Processing** - Uses Claude AI to analyze shipping documents
- 📦 **HS Code Classification** - Automatically maps goods to 8-digit HS codes
- 💰 **Duty & VAT Calculation** - CIF-based calculation with 14.5% VAT
- 📋 **SI Compliance** - Checks SI 122/2017 (licences) and SI 35/2024 (CBCA)
- 📄 **PDF Generation** - ZIMRA CF21 format Bill of Entry
- 📁 **ASYCUDA XML Export** - Ready for ZIMRA ASYCUDA World import
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express (proxy for Anthropic API)
- **AI**: Anthropic Claude API
- **PDF Generation**: jsPDF
- **Styling**: CSS-in-JS + Tailwind-like custom styles

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Anthropic API key

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Dean-Kage/lunarae.git
cd lunarae