<div align="center">

# 🔬 ResearchPilot
### *Agentic AI-Powered Research Intelligence Engine*

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_70B-F55036?style=for-the-badge)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)](LICENSE)

**ResearchPilot goes beyond single-model AI answers.**
It orchestrates a multi-agent debate pipeline that retrieves evidence from academic and web sources, argues both sides, and synthesizes a balanced, evidence-driven research report — in seconds.

[🚀 Quick Start](#-installation) · [🧠 Architecture](#-agentic-architecture) · [✨ Features](#-core-features) · [🛠 Tech Stack](#-technology-stack)

---

</div>

## 🎯 The Problem

> Most AI tools give you **one answer from one model** — with no transparency, no debate, and no evidence.

Researchers, students, and analysts need more than a chatbot response. They need:
- Evidence from **multiple academic sources**
- Analysis of **both sides** of complex questions
- A **balanced synthesis** — not just the model's best guess

**ResearchPilot solves this.**

---

## 🚀 How It Works

```
User Question
      ↓
  Query Refinement          →  Vague questions become precise research prompts
      ↓
  Hybrid Retrieval          →  arXiv · Semantic Scholar · PubMed · Google Search
      ↓
  Multi-Agent Debate        →  Pro Agents vs Con Agents argue the evidence
      ↓
  Moderator Synthesis       →  AI judge evaluates and balances both sides
      ↓
  Executive Research Report →  Structured, evidence-backed final output
```

---

## ✨ Core Features

### ⚖️ Multi-Agent Debate Engine
ResearchPilot runs a **5-agent reasoning pipeline** that evaluates both sides of any research question.

| Agent | Role |
|---|---|
| Pro Agent 1 | Identifies direct benefits and positive evidence |
| Pro Agent 2 | Analyzes systemic advantages and long-term gains |
| Con Agent 1 | Surfaces direct risks and critical limitations |
| Con Agent 2 | Examines long-term harms and counterarguments |
| Moderator Agent | Synthesizes all arguments into a balanced final insight |

> This mirrors how real academic peer review works — multiple expert perspectives, not one voice.

---

### 🔍 Hybrid Research Retrieval
Instead of relying on a single data source, ResearchPilot pulls evidence from **four live sources simultaneously**:

- 📄 **arXiv** — preprint academic papers
- 🎓 **Semantic Scholar** — peer-reviewed research
- 🏥 **PubMed** — biomedical and life science literature
- 🌐 **Google Search** — real-time web context via Serper API

---

### 🛡️ LLM Failover & Resilience
ResearchPilot includes an **automatic model fallback system**. If one AI provider fails or is slow, the system seamlessly switches to the next — ensuring uninterrupted analysis.

Supported providers: `OpenAI` · `Groq` · `Google Gemini` · `OpenRouter`

---

### ⚡ Ultra-Fast Inference
Powered by **Groq LLaMA-3.3 70B**, ResearchPilot delivers near real-time research analysis — complex multi-agent reasoning in seconds, not minutes.

---

### 💎 Perplexity-Style Research UI
A modern, dark glassmorphism interface with:
- Animated reasoning pipeline with live step indicators
- Evidence cards with source attribution
- Pro vs Con debate view
- Clean executive summary output

---

## 🧠 Agentic Architecture

### 1️⃣ Query Refiner Agent
Transforms vague, conversational questions into precise, academically-framed research prompts.

**Example:**
```
User Input:     "Is AI good for the economy?"
Refined Query:  "What is the measurable impact of artificial intelligence adoption
                 on GDP growth, labor productivity, and income inequality across
                 developed economies between 2018 and 2024?"
```

---

### 2️⃣ Hybrid Retrieval Layer
Simultaneously queries four data sources and returns the top evidence passages, ranked by relevance.

```
Academic Layer          Web Layer
──────────────          ─────────
arXiv API       ──→
Semantic Scholar ──→    Combined Evidence Pool
PubMed          ──→
                        Google Search (Serper) ──→
```

---

### 3️⃣ Multi-Agent Debate Engine
Four specialized agents conduct structured reasoning on the retrieved evidence — two arguing for, two arguing against.

```
Evidence Pool
      ↓
  ┌─────────────────┐     ┌─────────────────┐
  │  PRO AGENTS     │     │  CON AGENTS     │
  │  ─────────────  │     │  ─────────────  │
  │  • Benefits     │     │  • Risks        │
  │  • Advantages   │     │  • Limitations  │
  └─────────────────┘     └─────────────────┘
              ↓                   ↓
         ┌─────────────────────────┐
         │     MODERATOR AGENT     │
         │   Balanced Synthesis    │
         └─────────────────────────┘
```

---

### 4️⃣ Moderator & Final Report
The Moderator Agent produces a structured executive research report containing:

- ✅ Evidence summary
- ⚖️ Pro & Con arguments
- 🔍 Critical evaluation
- 🔬 Research gaps identified
- 📋 Final balanced synthesis

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · TailwindCSS · Vite |
| **Backend** | Python 3.11 · FastAPI · SSE Streaming |
| **AI Models** | Groq LLaMA-3.3 70B · OpenAI · Gemini · OpenRouter |
| **Database** | Supabase · PostgreSQL · pgvector |
| **Academic APIs** | arXiv · Semantic Scholar · PubMed |
| **Web Search** | Serper.dev (Google Search API) |

---

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/ResearchPilot.git
cd ResearchPilot
```

### 2. Backend Setup
```bash
cd backend

# Copy environment variables
cp .env.example .env

# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn main:app --reload --port 8000
```
> Backend runs at: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```
> Frontend runs at: `http://localhost:5173`

---

## 🔑 Environment Variables

Create a `.env` file inside `backend/` and fill in your keys:

```env
# AI Providers
GROQ_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here

# Web Search
SERPER_API_KEY=your_key_here

# Database
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here

# Settings
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
DEMO_MODE=false
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 📂 Project Structure

```
ResearchPilot/
│
├── backend/
│   ├── agents/
│   │   ├── pro_agent.py         ← Pro debate agent
│   │   ├── con_agent.py         ← Con debate agent
│   │   └── moderator.py         ← Moderator synthesis agent
│   │
│   ├── retrieval/
│   │   ├── arxiv.py             ← arXiv paper retrieval
│   │   ├── pubmed.py            ← PubMed retrieval
│   │   └── google_search.py     ← Serper web search
│   │
│   ├── database.py              ← Supabase connection
│   ├── models.py                ← Data models
│   ├── main.py                  ← FastAPI entry point
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/          ← UI components
│   │   ├── pages/               ← App pages
│   │   └── ui/                  ← Design system
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🎯 Why ResearchPilot?

| Feature | Typical AI Tools | ResearchPilot |
|---|---|---|
| Answer source | Single model | Multi-agent debate |
| Evidence | None | arXiv, PubMed, Scholar, Web |
| Perspective | One-sided | Pro + Con + Moderated |
| Transparency | Low | Full reasoning pipeline |
| Speed | Varies | Ultra-fast via Groq |
| Reliability | Single point of failure | Auto LLM failover |

---

## 👥 Built By

**Team Quantum Hackers**

> *Built for researchers who value evidence over bias.*
> *Designed for students, analysts, and policy researchers who need more than a chatbot.*

---

<div align="center">

**If ResearchPilot helped you think better, give it a ⭐**

[![MIT License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

</div>
