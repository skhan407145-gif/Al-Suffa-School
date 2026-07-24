# Al-Suffa School Management Application 🎓

> **🌐 Live Demo:** [https://al-suffa-school.vercel.app/](https://al-suffa-school.vercel.app/)

A modern, full-stack School Management System for **Al-Suffa Science & Grammar High Schools**. Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Express / Vercel Serverless Functions**, integrated with **Google Gemini 3.6 Flash AI**.

---

## 🌟 Key Features

* **Student Admission & Roster**: Register students, manage personal profiles, class assignments, and guardian contact info.
* **Fee Management**: Track monthly fee invoices, due status (Paid / Pending), receipts, and total revenue metrics.
* **Daily Attendance Logger**: Log daily attendance per class section with instant present/absent analytics.
* **Academic Grading & Results**: Generate term result cards, calculate GPAs, subject score breakdowns, and printable grade sheets.
* **Inventory & Expiry Tracker**: Monitor school supplies, science lab equipment, and first-aid stock levels with expiry alerts.
* **Student & Teacher Portals**: Submit online leave applications, anonymous campus feedback, and check academic results.
* **Gemini 3.6 Flash AI Integration**:
  * **Feedback Sentiment Analyzer**: Analyzes anonymous feedback for institutional quality improvements.
  * **Grade Predictor & Study Roadmap**: Generates personalized 4-week study routines based on student scores and attendance.
  * **AI Quiz & Lesson Plan Generator**: Drafts syllabus-aligned daily quizzes and teaching guidelines for teachers.

---

## 🏗️ Architecture & Storage

* **Frontend**: React 19 SPA built with Vite and styled with Tailwind CSS v4.
* **Data Storage**: Operates **in-memory** with automatic reactive sync to **Browser `localStorage`**. No database server setup required.
* **AI API proxy**: Express / Vercel Serverless Function proxying Gemini API requests server-side securely (`/api/ai/insights`).

---

## 🚀 Deploying to Vercel

### Prerequisites
* A [Vercel](https://vercel.com) account.
* A **Google Gemini API Key** (obtainable from [Google AI Studio](https://aistudio.google.com/app/apikey)).

---

### Option A: Deploy via GitHub (Recommended)

1. **Push your code** to a GitHub, GitLab, or Bitbucket repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel will automatically detect the **Vite** framework.
4. Verify the build settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   * **Name**: `GEMINI_API_KEY`
   * **Value**: *Your Google Gemini API Key*
6. Click **Deploy**. Vercel will build the frontend static assets and deploy the `/api/index.ts` serverless function automatically.

---

### Option B: Deploy via Vercel CLI

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Set your `GEMINI_API_KEY` environment variable in Vercel:
   ```bash
   vercel env add GEMINI_API_KEY
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## 🛠️ Environment Variables

Declare the following environment variables in your Vercel project settings or local `.env` file:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | **Yes** | API key for Google Gemini AI calls (`gemini-3.6-flash`). |

---

## 💻 Local Development Setup

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The Express development server with Vite middleware will start on `http://localhost:3000`.

4. **Lint and test build**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 📁 Directory Structure

```
├── api/                  # Vercel Serverless Function entrypoint (/api/index.ts)
├── src/                  # React Frontend Application
│   ├── components/       # UI Views (Dashboard, Admission, Fees, AI Insights, etc.)
│   ├── firebase.ts       # Reactive In-Memory & LocalStorage Database Handler
│   ├── initialData.ts    # Initial Seed Data for School Records
│   ├── types.ts          # Shared TypeScript Interfaces
│   ├── App.tsx           # Main Application Routing & State
│   └── main.tsx          # React Entry Point
├── server.ts             # Express server entry point for local development
├── vercel.json           # Vercel routing & rewrite configuration
├── package.json          # Build scripts and npm dependencies
└── README.md             # Deployment instructions
```

---

## 📄 License

This project is licensed under the MIT License.
<img width="1154" height="762" alt="image" src="https://github.com/user-attachments/assets/3acf4a17-cd32-4376-8e7b-91045049eb9c" />
<img width="1151" height="761" alt="image" src="https://github.com/user-attachments/assets/4b51f52d-242a-45ec-9ecb-deccdcb65e8a" />
<img width="1142" height="740" alt="image" src="https://github.com/user-attachments/assets/9ba994fc-ab73-4055-9381-cd7353ae4b19" />



