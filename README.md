# AI Data Explorer SaaS 🚀

AI Data Explorer is a secure, multi-tenant SaaS application that allows users to query complex databases using plain English. Built with Next.js, NextAuth, and the Google Gemini API, it acts as a universal data layer and AI analyst for your organization.

## ✨ Features

- **Multi-Database Support**: Connect natively to **PostgreSQL**, **MySQL**, and **MongoDB**.
- **File Uploads**: Non-technical users can drag-and-drop **CSV** or **Excel** files to query them instantly.
- **Chat IDE Experience**: Refine queries in a multi-turn, ChatGPT-style conversation context.
- **Auto-Visualization**: The AI automatically suggests and renders the best chart type (Bar, Line, Pie) or Data Table for your results.
- **Query Explanations**: Generated SQL/NoSQL is explained in plain English for non-technical users.
- **Edit & Re-run**: Inspect the AI-generated query, manually edit the syntax, and execute it directly.
- **Enterprise Security**:
  - Multi-tenant isolation (Firms & Users) with Role-Based Access Control (Admin vs. Viewer).
  - Strict **Query Safety Layer** blocks destructive commands (`DROP`, `DELETE`, `UPDATE`, etc.).
  - Read-only execution environment.
- **AI Self-Correction**: If a generated query throws an error, the backend feeds the error back to the AI for automatic self-correction and retry.
- **Query History & Audit**: Every executed query is logged and searchable.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Authentication**: NextAuth.js
- **AI/LLM**: Google Gemini API (`@google/genai`)
- **Internal Database**: MongoDB (stores Users, Firms, Connections, and uploaded datasets)
- **Database Drivers**: `pg`, `mysql2`, `mongodb`
- **File Parsing**: `papaparse`, `xlsx`
- **Visualizations**: Recharts
- **Styling**: Custom CSS variables with Dark/Light mode support

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **MongoDB Database** (Local instance or MongoDB Atlas) for the internal SaaS tables.
3. **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```env
   # Your Google Gemini API Key
   GEMINI_API_KEY="your_api_key_here"

   # Internal MongoDB URI (used to store SaaS user accounts and connections)
   MONGODB_URI="mongodb://127.0.0.1:27017/ai_explorer_saas"

   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_super_secret_string_here"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

1. **Register a Firm**: Click "Register Firm" on the landing page to create your Admin account.
2. **Connect Data**: Go to the **Data Sources** tab.
   - You can connect an external database using a URI string (e.g., `postgresql://user:pass@localhost:5432/mydb`).
   - Or, simply upload a `.csv` or `.xlsx` file.
3. **Query Data**: Go to the **Query Data** tab, select your data source, and ask a question in plain English (e.g., *"Show me the top 5 users by revenue"*).
4. **Invite Team**: Go to **Team Settings** to invite colleagues as Viewers or Admins.

## 🔒 Security Recommendations for Production

- Always use **read-only database credentials** when connecting external data sources.
- Ensure `NEXTAUTH_SECRET` is set to a long, random cryptographically secure string.
- If deploying to production, ensure your MongoDB cluster is secured and IP-allowlisted.
