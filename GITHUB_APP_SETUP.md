# GitHub App Setup for Dispatch

## 1. Create the GitHub App

Go to **GitHub → Settings → Developer settings → GitHub Apps → New GitHub App**
(or visit `https://github.com/settings/apps/new` while signed in).

### App settings

| Field | Value |
|---|---|
| **GitHub App name** | `Dispatch` (must be globally unique — append your org name if needed) |
| **Homepage URL** | Your deployment URL, e.g. `https://dispatch.example.com` |
| **Webhook URL** | `https://dispatch.example.com/api/webhooks/github` |
| **Webhook secret** | Generate a random string: `openssl rand -hex 32` |

### Permissions (Repository)

| Permission | Access |
|---|---|
| `Contents` | Read-only |
| `Issues` | Read & write |
| `Pull requests` | Read & write |

### Events to subscribe

Check all of the following:

- [x] Pull request
- [x] Pull request review
- [x] Pull request review requested
- [x] Issues
- [x] Issue comment

### Where can this GitHub App be installed?

Choose **Any account** for public use, or **Only on this account** for private/testing.

---

## 2. After creation — collect credentials

Once the app is created, collect the following from the app settings page:

### From the app's General settings page

```
GITHUB_APP_ID=<App ID shown at the top of the page>
```

### Generate a private key

Scroll to **Private keys** → click **Generate a private key**.
A `.pem` file will be downloaded. Store it as a single-line env var (replace newlines with `\n`):

```bash
GITHUB_APP_PRIVATE_KEY="$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' dispatch.YYYY-MM-DD.private-key.pem)"
```

### Webhook secret

```
GITHUB_WEBHOOK_SECRET=<the secret you generated in step 1>
```

---

## 3. Create a GitHub OAuth App (for user sign-in)

Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.

| Field | Value |
|---|---|
| **Application name** | `Dispatch` |
| **Homepage URL** | Your deployment URL |
| **Authorization callback URL** | `https://dispatch.example.com/api/auth/callback/github` |

For local development use `http://localhost:3000` as the base URL.

After creation:

```
GITHUB_CLIENT_ID=<Client ID>
GITHUB_CLIENT_SECRET=<Client secret (click Generate a new client secret)>
```

---

## 4. Full .env checklist

```env
DATABASE_URL=postgresql://...
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
NEXTAUTH_URL=https://dispatch.example.com
NEXTAUTH_SECRET=   # openssl rand -base64 32
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

---

## 5. Install the GitHub App on a repository

1. Go to `https://github.com/settings/apps/<your-app-name>/installations`
2. Click **Install** → choose an account → select repositories
3. The `installationId` will appear in the URL after installation:
   `https://github.com/settings/installations/<installationId>`

Store this ID in the `installations` table (handled automatically by the webhook when the `installation` event fires).

---

## 6. Local development with webhooks

Use [smee.io](https://smee.io) or [ngrok](https://ngrok.com) to forward webhook events to `localhost:3000`:

```bash
# Using smee
npx smee-client --url https://smee.io/<channel> --target http://localhost:3000/api/webhooks/github

# Using ngrok
ngrok http 3000
# Then update Webhook URL in your GitHub App settings to: https://<id>.ngrok.io/api/webhooks/github
```
