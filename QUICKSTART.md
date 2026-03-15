# ⚡ Quick Start Guide

Get started with AI Code Review in **< 5 minutes**

## Step 1: Setup (2 minutes)

```powershell
# 1. Install dependencies
npm install

# 2. Get free Groq API key
# Visit: https://console.groq.com/keys
# Sign up (no credit card needed)
# Copy your API key (starts with gsk_)

# 3. Create .env file
echo "GROQ_API_KEY=gsk_YOUR_KEY_HERE" > .env
```

## Step 2: Run Your First Review (1 minute)

```powershell
# Analyze a JavaScript file
node code-review.js sample_1.js

# Or any file in your project
node code-review.js path/to/app.js
```

## Step 3: View Results (1 minute)

The terminal will show:
- 🔴 Risk level (HIGH/MEDIUM/LOW)
- Quality score (0-100)
- Detailed issues with line numbers
- Suggested fixes
- Strengths and recommendations

## Common Commands

```powershell
# Terminal output (default, with colors)
node code-review.js file.js

# Save as JSON
node code-review.js file.js --format json

# Save as Markdown
node code-review.js file.js --export md

# Both JSON and view
node code-review.js file.js --format json --export json
```

## Example Output

```
Quality Score: 48/100 ███████░░░░░░░░░░░░░░

🔴 HIGH SEVERITY

▸ SECURITY - SQL Injection vulnerability
  Line 5
  The query directly concatenates user input...
  💡 Fix: Use parameterized queries instead.

🟡 MEDIUM SEVERITY

▸ PERFORMANCE - Inefficient O(n²) algorithm
  Line 31
  The nested loops can be optimized...
  💡 Fix: Use a Set for O(n) complexity.

✓ Strengths:
  ● Good error handling
  ● Consistent naming
```

## Supported Languages

JavaScript | Python | Java | TypeScript | Go | Rust | C++ | C# | Ruby | PHP | Swift | Kotlin

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "GROQ_API_KEY not set" | Create `.env` file with `GROQ_API_KEY=gsk_YOUR_KEY` |
| "Invalid JSON" | Update: `npm install` |
| "Model decommissioned" | Check available models at https://console.groq.com/docs/models |
| Slow speed | Increase chunk size: `--chunk-size 100` |

## Need Help?

See [README.md](README.md) for full documentation, GitHub Actions setup, and advanced features.

---

**Ready to review your code? Let's go!** 🚀

```powershell
node code-review.js your-file-here.js
```
