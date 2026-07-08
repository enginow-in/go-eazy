## Local Setup Instructions (add to README.md)

### 1) Install dependencies
```bash
npm install
```

### 2) Configure Supabase environment variables
1. Copy `.env.example` to `.env` (or use the provided example file).
2. Fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

> These are required for the frontend to connect to Supabase.

### 3) Run the app
```bash
npm run dev
```

Open the local URL shown in your terminal (typically `http://localhost:5173`).

