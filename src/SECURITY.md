# Security Policy

## Sensitive Files - DO NOT COMMIT

The following files contain sensitive credentials and must NEVER be committed to GitHub:

### 🔴 Protected Files
- `/utils/supabase/info.tsx` - Contains Supabase project credentials
- Any `.env` files
- Any files with API keys, tokens, or passwords

### ✅ These files ARE protected by .gitignore
Our `.gitignore` file is configured to exclude all sensitive files automatically.

## Verifying Before Commit

Always run this before committing:

```bash
git status
```

**STOP** if you see any of these files:
- `utils/supabase/info.tsx`
- `.env` or similar environment files

## For New Contributors

If you're setting up this project:

1. Copy the example file:
   ```bash
   cp utils/supabase/info.example.tsx utils/supabase/info.tsx
   ```

2. Add your own Supabase credentials to `info.tsx`

3. **Never** commit your `info.tsx` with real credentials

## Reporting Security Issues

If you discover a security vulnerability, please DO NOT open a public issue. Instead:

1. Contact the maintainers privately
2. Provide details about the vulnerability
3. Allow time for a fix before public disclosure

## What to Do If Credentials Are Exposed

If you accidentally commit sensitive credentials:

1. **Immediately** rotate all exposed credentials:
   - Supabase: Dashboard → Settings → API → Generate new keys
   
2. Remove the file from Git:
   ```bash
   git rm --cached utils/supabase/info.tsx
   git commit -m "Remove sensitive credentials"
   git push --force
   ```

3. Consider using tools like [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to remove from history

4. Notify any users if credentials were exposed for an extended period

## Best Practices

✅ **DO:**
- Use environment variables for sensitive data
- Use the provided `.gitignore`
- Review commits before pushing
- Rotate credentials regularly

❌ **DON'T:**
- Hardcode API keys in source files
- Commit `.env` files
- Share screenshots with visible credentials
- Ignore git status warnings

---

**Remember**: Prevention is easier than cleanup. Always verify before you commit!
