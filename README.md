# BuildLab

Turn AI tutorials into scannable build blueprints with proof-of-work completion.

## Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub
```bash
cd buildlab
git init
git add .
git commit -m "BuildLab MVP"
gh repo create buildlab --public --push
```

Or create a repo on github.com manually and push.

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your `buildlab` GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key from https://console.anthropic.com/settings/keys
5. Click **Deploy**

### Step 3: Done
Your app is live at `https://buildlab-xxx.vercel.app`

## Local Development
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm install
npm run dev
```

## Tech Stack
- Next.js 14 (App Router)
- Anthropic Claude API (server-side)
- localStorage for persistence
- No database required
