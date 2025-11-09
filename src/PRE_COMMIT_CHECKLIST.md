# Pre-Commit Checklist

Use this checklist **BEFORE EVERY** `git push`:

## Security Check ⚠️

- [ ] Run `git status`
- [ ] Verify `utils/supabase/info.tsx` is NOT in the staged files
- [ ] No `.env` files are staged
- [ ] No API keys or passwords in code
- [ ] Review files with `git diff --cached`

## Code Quality ✓

- [ ] Code runs without errors (`npm run dev`)
- [ ] No console errors in browser
- [ ] Tested main features work
- [ ] Commit message is clear and descriptive

## Documentation 📝

- [ ] Update README if you added new features
- [ ] Update comments for complex code
- [ ] Update CHANGELOG if you have one

## If Everything Checks Out ✅

```bash
git add .
git commit -m "Your descriptive commit message"
git push
```

---

**🚨 IF YOU SEE `info.tsx` IN GIT STATUS, DO NOT COMMIT! 🚨**
