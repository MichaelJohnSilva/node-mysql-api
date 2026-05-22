# Node.js + TypeScript + MySQL API

## Live URLs
- **Backend API:** https://node-mysql-api-t9ui.onrender.com
- **Swagger Docs:** https://node-mysql-api-t9ui.onrender.com/api-docs

## Tech Stack
Node.js · TypeScript · Express · Sequelize · MySQL (filess.io) · Mailtrap · JWT

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` (copy from `.env.example`)
```bash
cp .env.example .env
```
Fill in your filess.io database credentials and Mailtrap SMTP credentials.

### 3. Run dev server (port 3000)
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST` | filess.io MySQL host |
| `DB_PORT` | MySQL port (default 3306) |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Strong random secret for signing JWTs |
| `CORS_ORIGIN` | Exact frontend URL (https://angular-21-boilerplate-0o8b.onrender.com) |
| `COOKIE_SECURE` | Set `true` in production (HTTPS only) |
| `SMTP_HOST` | Mailtrap SMTP host (`sandbox.smtp.mailtrap.io`) |
| `SMTP_PORT` | Mailtrap SMTP port (`2525`) |
| `SMTP_USER` | Mailtrap username |
| `SMTP_PASS` | Mailtrap password |
| `EMAIL_FROM` | Sender address |

## Render Deployment (Web Service)

1. Connect GitHub repo
2. Build command: `npm install`
3. Start command: `npm start`
4. Add all environment variables listed above in the Render dashboard

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /accounts/register | Register new account |
| POST | /accounts/authenticate | Login |
| POST | /accounts/verify-email | Verify email token |
| POST | /accounts/forgot-password | Request password reset |
| POST | /accounts/reset-password | Reset password with token |
| POST | /accounts/refresh-token | Refresh JWT |
| POST | /accounts/revoke-token | Logout |
| GET | /accounts | Get all accounts (Admin) |
| GET | /accounts/:id | Get account by ID |
| PUT | /accounts/:id | Update account |
| DELETE | /accounts/:id | Delete account (Admin) |
