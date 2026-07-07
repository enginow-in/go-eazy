# Contributing to GoEazy

First off, thank you for considering contributing to GoEazy! This guide will help you set up your local development environment from scratch so you can avoid common hiccups and start coding immediately.

## 1. Fork & Clone

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/go-eazy.git
   cd go-eazy
   ```
3. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 2. Install Dependencies

Ensure you have Node.js installed, then run:
```bash
npm install
```

## 3. Environment Variables Setup

GoEazy relies on **Supabase** for its backend and **Razorpay** for payments. You will need to create free accounts for both to get your local environment running.

### 🟢 Supabase Setup
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Once created, go to **Project Settings** (gear icon ⚙️) -> **API**.
3. Create a `.env` file in the root of your local project (you can copy `.env.example`).
4. Copy the **Project URL** and paste it as your `VITE_SUPABASE_URL`.
5. Copy the `anon` `public` key and paste it as your `VITE_SUPABASE_ANON_KEY`.

### 🔵 Razorpay Setup
1. Go to the [Razorpay Dashboard](https://dashboard.razorpay.com/) and create a free account.
2. Ensure you are in **Test Mode**.
3. Go to **Account & Settings** -> **API Keys** and click **Generate Test Key**.
4. In your `.env` file:
   - Set both `VITE_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_ID` to the generated **Key Id**.
   - Set `RAZORPAY_KEY_SECRET` to the generated **Key Secret**.
5. Go to **Webhooks** in Razorpay settings, create a dummy webhook (e.g., `https://example.com`), make up a secure password, and set it as your `RAZORPAY_WEBHOOK_SECRET` in the `.env` file.

## 4. Database Setup

Instead of manually creating tables, you can automatically push the repository's database schema to your Supabase project using the Supabase CLI.

1. Login to the CLI:
   ```bash
   npx supabase login
   ```
   *(You will need a Personal Access Token from your Supabase Account settings).*

2. Link your local project to your remote Supabase project:
   ```bash
   npx supabase link --project-ref <your-project-id>
   ```
   *(Find the 20-character `<your-project-id>` in your Supabase Dashboard URL).*

3. Push the schema and rules to your database:
   ```bash
   npx supabase db push
   ```
   This will run all files in the `supabase/migrations/` folder, completely setting up your database!

## 5. Run the Application

You are all set! Start the local development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## 6. Submitting a Pull Request

1. Commit your changes: `git commit -m "Add some feature"`
2. Push to your branch: `git push origin feature/your-feature-name`
3. Open a Pull Request on the original repository.

Happy Contributing! ❤️
