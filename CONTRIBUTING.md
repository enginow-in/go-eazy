# Contributing to GoEazy 🏔️

Thank you for wanting to contribute to GoEazy! To make the contribution process smooth, please follow the guidelines below.

---

## 🛠️ Local Development & Backend Setup

GoEazy uses **Supabase** for user authentication, database management (PostgreSQL), and image storage. Follow these steps to link the project to your own Supabase instance:

### Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and sign in.
2. Click **New Project** and configure your organization, database name, and password.

### Step 2: Configure Environment Variables
1. Duplicate `.env.example` in the root of the project and rename it to `.env`.
2. Find your API keys in the Supabase Dashboard under **Settings (Gear Icon) -> API**.
3. Copy your project's **Project URL** and **anon public** API key, then paste them in your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
   ```

### Step 3: Set Up Database Schemas and Migrations
1. In the Supabase Dashboard, click on the **SQL Editor** (icon with `SQL` on the left sidebar).
2. Click **New query** (or `+ New Query`).
3. Open [supabase/schema.sql](supabase/schema.sql) in your local editor, copy its contents, paste them into the SQL Editor, and click **Run**. This establishes your baseline tables.
4. Click **New query** again.
5. Copy the contents of [supabase/consolidated_migrations.sql](supabase/consolidated_migrations.sql), paste them in, and click **Run**. This adds the updated columns (such as onboarding preferences), tables (reviews, site visits, notifications, service providers), and required RLS permissions.

### Step 4: Disable Email Confirmation (Highly Recommended)
By default, Supabase requires users to verify their email address before logging in. For local development:
1. In the Supabase Dashboard, click **Authentication** -> **Providers** -> **Email**.
2. Toggle **Confirm email** to **OFF**.
3. Click **Save**.

### Step 5: Sign Up a Landlord User
1. Start your local development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173/` in your browser.
3. Click **Sign Up** in the navigation bar.
4. Create a user with the email **`admin@goeazy.com`** and choose **Landlord** as the role. 

### Step 6: Seed Sample Data
1. In the Supabase SQL Editor, click **New query**.
2. Copy and paste the contents of [supabase/seed.sql](supabase/seed.sql) and click **Run**.
3. The script will dynamically find your newly registered landlord account (`admin@goeazy.com`) and assign the 5 pre-configured sample properties to it.

---

## 🗄️ Database File Reference

Here is a breakdown of the database files inside the `supabase/` folder:

*   **`schema.sql`**: Defines the base table structure (`profiles`, `properties`, `favorites`, `recently_viewed`), initial Row-Level Security (RLS) policies, default storage bucket (`property-images`), and basic functions.
*   **`consolidated_migrations.sql`**: Consolidated incremental migrations. It adds the `onboarding_data` preferences column, review system tables (`property_reviews`, `service_reviews`), site visits booking, notifications, and service provider directory tables.
*   **`seed.sql`**: Seeds your local workspace with fully populated properties so you can explore search features and dashboards immediately without manually filling out forms.

---

## 🚀 How to Submit Your Contributions

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/go-eazy.git
   ```
3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Commit** your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add user profile picture upload"
   ```
5. **Push** your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against the `main` branch of the original repository.
