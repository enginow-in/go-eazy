# Contributing to GoEazy 🏔️

Thanks for taking the time to contribute! Having people help out makes the project better for everyone.

To get your local environment up and running smoothly, please follow the steps below in order.

---

## 🛠️ Local Development & Backend Setup

GoEazy runs on **Supabase** for user authentication, database tables, and image hosting. Follow these steps to configure your local clone:

### 1. Fork & Clone the Repository
1. **Fork** this repository to your own GitHub account.
2. **Clone** your fork to your computer:
   ```bash
   git clone https://github.com/YOUR_USERNAME/go-eazy.git
   ```
3. Enter the project directory:
   ```bash
   cd go-eazy
   ```

### 2. Install Project Dependencies
Use `npm` to install all the frontend and tooling dependencies:
```bash
npm install
```

### 3. Spin up a Supabase Project
1. Head over to [Supabase](https://supabase.com) and create a free project.
2. Choose your database name, region, and set a password.

### 4. Configure Environment Variables
1. Duplicate `.env.example` in the root of the project and rename it to `.env`.
2. Grab your project keys from your Supabase Dashboard under **Settings -> API**.
3. Copy your **Project URL** and the **anon public key**, then paste them into your `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
   ```

### 5. Run the Database Schemas & Migrations
1. In your Supabase Dashboard, click on the **SQL Editor** tab (the `SQL` terminal icon in the left sidebar).
2. Click **New query**.
3. Open `supabase/schema.sql` in your editor, copy everything, paste it into the SQL Editor, and click **Run**. This builds the core database tables.
4. Click **New query** again.
5. Copy and paste the contents of `supabase/consolidated_migrations.sql` and run it. This adds newer columns (like user quiz preferences), reviews, site visits, and the service provider marketplace.

### 6. Turn Off Email Confirmations (Crucial for Local Testing)
By default, Supabase won't let new users sign in until they verify their email. To make local testing painless:
1. In the Supabase Dashboard, go to **Authentication -> Providers -> Email**.
2. Toggle **Confirm email** to **OFF** and click **Save**.

### 7. Create a Landlord Account & Start the App
1. Start your local dev server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173/` and click **Sign Up** in the nav bar.
3. Register a new user with the email **`admin@goeazy.com`** and select the **Landlord** role.

### 8. Run the Seed Script
1. Go back to your Supabase SQL Editor and click **New query**.
2. Copy and paste the contents of `supabase/seed.sql` and click **Run**.
3. The script will dynamically look up the landlord ID for `admin@goeazy.com` and load 5 pre-made properties into your dashboard.



## 🚀 Creating a Pull Request

Once you have made your changes and are ready to contribute:

1. **Create a new branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Commit** your work with clear messages:
   ```bash
   git commit -m "feat: add onboarding quiz reset button"
   ```
3. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. **Open a Pull Request** against our `main` branch. 

Happy coding! ❤️
