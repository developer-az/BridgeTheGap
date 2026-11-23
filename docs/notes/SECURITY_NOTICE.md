# 🔒 Security Notice - API Keys

## ⚠️ IMPORTANT: Files Containing Sensitive Data

The following files contain **YOUR ACTUAL API KEYS** and are excluded from git:

### Excluded Files (Never Committed):
- ✅ `API_KEYS_SETUP.md` - Contains your OpenRouter key
- ✅ `OPENROUTER_SETUP_COMPLETE.md` - Contains your OpenRouter key  
- ✅ `QUICK_START_OPENROUTER.md` - Contains your OpenRouter key
- ✅ `setup-env.ps1` - Contains your OpenRouter key
- ✅ `.env`, `.env.local`, `.env.*` - All environment files
- ✅ `frontend-web/.env.local` - Frontend environment variables
- ✅ `backend/.env` - Backend environment variables

### Template Files (Safe to Commit):
- 📄 `API_KEYS_SETUP.template.md` - Template without real keys
- 📄 `setup-env.template.ps1` - Template setup script
- 📄 `.env.example` - Example environment files

## 🛡️ How We Protect Your Keys

1. **Root `.gitignore`** - Blocks all sensitive files
2. **Template files** - Provide documentation without exposing keys
3. **Environment variables** - Keys stored in `.env` files only
4. **Clear naming** - `.template` files are safe, others are not

## 🚨 If You Accidentally Committed Keys

If you accidentally committed API keys to git:

### 1. Revoke the Exposed Key Immediately
- **OpenRouter**: Go to https://openrouter.ai/keys and delete the key
- **Amadeus**: Go to your Amadeus dashboard and regenerate credentials
- **Google**: Go to Google Cloud Console and restrict/delete the key

### 2. Generate New Keys
- Create new API keys from the respective services
- Update your local `.env` files with new keys

### 3. Remove from Git History
```bash
# Remove the file from git history (careful!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch API_KEYS_SETUP.md" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if necessary and you understand the implications)
git push origin --force --all
```

**Better approach:** Create a new repository and only add safe files.

## ✅ Checklist Before Committing

Before running `git commit`, verify:

- [ ] No `.env` files are staged
- [ ] No files with actual API keys are staged  
- [ ] Only `.template` versions of sensitive files are committed
- [ ] Run `git status` to double-check

## 📋 Safe Git Workflow

```bash
# 1. Check what's being committed
git status

# 2. Only add safe files
git add README.md
git add src/

# 3. Or use .gitignore and add all (safer)
git add .

# 4. Verify nothing sensitive is included
git status

# 5. Commit
git commit -m "Your message"

# 6. Push
git push
```

## 🔍 How to Check If Keys Are Exposed

```bash
# Search your git history for potential keys
git log -p | grep -i "sk-or-v1-"
git log -p | grep -i "OPENROUTER_API_KEY"

# Check current staged files
git diff --cached
```

## 💡 Best Practices

1. **Never hardcode keys** - Always use environment variables
2. **Use .gitignore** - Keep it updated with sensitive file patterns
3. **Review before committing** - Always check `git status` and `git diff`
4. **Use templates** - Provide `.template` versions for documentation
5. **Rotate keys regularly** - Change API keys periodically
6. **Limit key permissions** - Use the minimum required access level
7. **Monitor usage** - Check API dashboards for unexpected activity

## 🆘 Need Help?

If you think your keys were exposed:

1. **Act immediately** - Revoke the keys first, ask questions later
2. **Check your git history** - Look for commits containing keys
3. **Regenerate all keys** - Don't take chances
4. **Update your `.gitignore`** - Ensure it's comprehensive
5. **Consider a fresh repo** - Sometimes easier than cleaning history

## 📚 Resources

- **GitHub Security**: https://docs.github.com/en/code-security
- **Git Secrets Tool**: https://github.com/awslabs/git-secrets
- **OpenRouter Security**: https://openrouter.ai/docs#security
- **Environment Variables Guide**: https://12factor.net/config

---

**Remember:** Once a key is pushed to git, consider it compromised. Git history is permanent and hard to clean. Prevention is always better than remediation! 🔒

