# Getting Started with Expense Splitter

Welcome to Expense Splitter! This guide will help you get up and running with the application.

## 🚀 Installation

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- PostgreSQL database
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/expense-splitter.git
cd expense-splitter
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update the `.env.local` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/expense_splitter?schema=public"
   
   # Authentication
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   
   # Other settings
   NODE_ENV=development
   ```

### Step 4: Set Up the Database

1. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

2. (Optional) Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```

### Step 5: Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|:--------:|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | - | ✅ |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` | ✅ |
| `NODE_ENV` | Application environment | `development` | ❌ |

### Database Configuration

Expense Splitter uses Prisma as its ORM. The database schema is defined in `prisma/schema.prisma`. After making changes to the schema, run:

```bash
npx prisma generate
npx prisma migrate dev --name your_migration_name
```

## 🎯 First Steps

1. **Create an Account**
   - Click on "Sign Up" and fill in your details
   - Verify your email address (if email verification is enabled)

2. **Create Your First Group**
   - Navigate to "Groups" in the sidebar
   - Click "Create New Group"
   - Add group members by their email addresses

3. **Add Your First Expense**
   - Go to the "Expenses" tab
   - Click "Add Expense"
   - Fill in the expense details and split options

4. **Settle Up**
   - Navigate to "Settlements" to see who owes what
   - Record payments to keep track of settled amounts

## 📱 Mobile App

Expense Splitter is a Progressive Web App (PWA), which means you can install it on your mobile device:

1. Open the app in Chrome or Safari on your mobile device
2. Tap the share button
3. Select "Add to Home Screen"
4. Confirm the installation

## 🆘 Need Help?

If you encounter any issues during setup, please check our [Troubleshooting Guide](/docs/guides/troubleshooting) or [open an issue](https://github.com/yourusername/expense-splitter/issues) on GitHub.
