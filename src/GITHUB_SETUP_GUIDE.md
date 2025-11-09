# GitHub Setup Guide for Expressify

## 🚨 CRITICAL: Files You MUST NOT Share Publicly

### ❌ Never Commit These Files:
- `/utils/supabase/info.tsx` - Contains your Supabase credentials
- `.env` or any environment files with API keys
- Any files with passwords, tokens, or secret keys

### ✅ Safe to Share:
- All component files in `/components/`
- All UI components in `/components/ui/`
- Utility files (except `info.tsx`)
- Styles, README, documentation
- Server code (without hardcoded secrets)

## Step-by-Step: Adding Your Project to GitHub

### Step 1: Verify .gitignore is Working

Before doing anything else, check that sensitive files are ignored:

```bash
# Make sure you're in your project directory
cd /path/to/expressify

# Check git status (info.tsx should NOT appear)
git status
```

If `utils/supabase/info.tsx` appears in the list, **STOP** and make sure `.gitignore` is properly set up.

### Step 2: Initialize Git Repository (if not already done)

```bash
# Initialize git
git init

# Add all files (except those in .gitignore)
git add .

# Create your first commit
git commit -m "Initial commit: Expressify AAC communication app"
```

### Step 3: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `expressify` (or your preferred name)
   - **Description**: "Modern AAC communication app for children with ASD and ADHD"
   - **Visibility**: Choose **Public** or **Private**
   - ⚠️ **DO NOT** initialize with README (you already have one)
4. Click **"Create repository"**

### Step 4: Connect Local Repository to GitHub

GitHub will show you commands. Use these:

```bash
# Add GitHub as remote origin (replace with YOUR username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/expressify.git

# Push your code
git branch -M main
git push -u origin main
```

### Step 5: Verify Security

After pushing, go to your GitHub repository and check:

1. ✅ Verify `/utils/supabase/info.tsx` is **NOT** visible
2. ✅ Verify `/utils/supabase/info.example.tsx` **IS** visible
3. ✅ Verify `.gitignore` is there

### Step 6: Add Additional Repository Settings (Recommended)

1. **Add Topics/Tags**: Go to repository → "About" → Add tags like:
   - `aac`
   - `accessibility`
   - `autism`
   - `adhd`
   - `communication`
   - `react`
   - `typescript`
   - `supabase`

2. **Add a License**: 
   - Go to "Add file" → "Create new file"
   - Name it `LICENSE`
   - Choose a license (MIT is common for open source)

3. **Enable Issues/Discussions** (if you want community input):
   - Settings → Features → Check "Issues" and "Discussions"

## Making Future Updates

```bash
# After making changes
git add .
git commit -m "Description of your changes"
git push
```

## 🛡️ Security Checklist

Before pushing ANY commit:

- [ ] Run `git status` and verify `info.tsx` is not listed
- [ ] Never commit files with real API keys or passwords
- [ ] Use environment variables for sensitive data
- [ ] Double-check `.gitignore` includes all sensitive files
- [ ] Review files being committed with `git diff --cached`

## ⚠️ If You Accidentally Committed Secrets

If you accidentally pushed your `info.tsx` file with real credentials:

1. **Immediately rotate your Supabase keys**:
   - Go to Supabase Dashboard → Settings → API
   - Generate new keys
   - Update your local `info.tsx`

2. **Remove the file from Git history**:
   ```bash
   git rm --cached utils/supabase/info.tsx
   git commit -m "Remove sensitive file"
   git push
   ```

3. **Consider using** `git filter-branch` or `BFG Repo-Cleaner` to remove from history

## 📝 Example Repository Description

```
Expressify - Modern AAC Communication App

A mobile-first Augmentative and Alternative Communication (AAC) application 
built with React, TypeScript, and Supabase. Designed for children with 
Autism Spectrum Disorder (ASD) and ADHD to express their needs using 
ARASAAC pictograms.

Features:
• 30,000+ ARASAAC pictograms with multilingual support
• Custom communication boards
• Text-to-speech functionality
• Dark mode support
• Caregiver dashboard with progress tracking
• Routine task management
• Learning games

Tech Stack: React, TypeScript, Tailwind CSS, Supabase, ARASAAC API
```

## 🤝 Best Practices

1. **Write clear commit messages**:
   ```bash
   git commit -m "feat: Add PDF export to caregiver dashboard"
   git commit -m "fix: Resolve dark mode color issues"
   git commit -m "docs: Update setup instructions"
   ```

2. **Use branches for features**:
   ```bash
   git checkout -b feature/new-game
   # Make changes
   git commit -m "feat: Add shape matching game"
   git push -u origin feature/new-game
   ```

3. **Keep commits focused**: One feature/fix per commit

4. **Update README** when adding new features

## 📧 Questions?

If you have questions about GitHub setup, check:
- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

---

Remember: **When in doubt, don't push!** You can always ask for help before committing sensitive information.
