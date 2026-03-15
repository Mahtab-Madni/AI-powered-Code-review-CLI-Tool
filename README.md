#  AI-Powered Code Review CLI Tool

> **Automated Code Quality Analysis** using **Groq AI** with Structured Output, Security Scanning, and GitHub Actions Integration

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)
![Groq API](https://img.shields.io/badge/Groq-LLaMA%203.3-orange)

---

## ✨ Features

### 🎯 Core Features
- **AI-Powered Code Analysis** - Uses Groq's LLaMA 3.3 (fast, free LLM inference)
- **Structured Output** - Schema-enforced JSON reviews with guaranteed fields
- **Multi-Language Support** - JavaScript, Python, Java, TypeScript, Go, Rust, C++, and more
- **Smart Chunking** - Automatically splits large files while preserving function boundaries
- **Multiple Output Formats** - Terminal (colored), JSON, Markdown, GitHub PR comments

### 🔐 Analysis Capabilities
- **Security Scanning** - Detects SQL injection, XSS, hardcoded credentials, unsafe patterns
- **Performance Analysis** - Identifies memory leaks, inefficient algorithms, race conditions
- **Bug Detection** - Reports null pointer exceptions, logic errors, edge cases
- **Best Practices** - Validates design patterns, SOLID principles, naming conventions
- **Code Quality** - Assesses readability, maintainability, documentation

### 📊 Classification
Each issue is categorized by:
- **Severity**: HIGH 🔴 | MEDIUM 🟡 | LOW 🔵
- **Category**: security | performance | bug | style | best-practice
- **Line Numbers**: Exact locations for quick fixes

### 🚀 GitHub Actions
- Automated PR reviews on every pull request
- Comments directly on changed lines
- CI/CD blocking for HIGH severity issues
- Customizable severity thresholds

---

## 📋 Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** or **yarn** package manager
- **Groq API Key** (free account at https://console.groq.com/)

### Verify Node.js
```powershell
node --version  # Should be v18.0.0 or higher
npm --version
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Get Groq API Key
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create a free account (no credit card needed)
3. Generate an API key (starts with `gsk_`)

### 3. Configure Environment
Create or update `.env` file in the project root:
```env
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
```

**Or set via PowerShell (session-only):**
```powershell
$env:GROQ_API_KEY='gsk_YOUR_API_KEY_HERE'
```

**Or set as permanent Windows environment variable:**
```powershell
[System.Environment]::SetEnvironmentVariable('GROQ_API_KEY', 'gsk_YOUR_API_KEY_HERE', 'User')
```

### 4. Run Your First Review
```powershell
# Analyze a single file
node code-review.js path/to/your/file.js

# Try with a sample
node code-review.js sample_1.js
```

---

## 📖 Usage

### Basic Syntax
```powershell
node code-review.js <file-path> [options]
```

### Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `--format <type>` | Output format: `terminal`, `json`, `github` | `--format json` |
| `--export <format>` | Export to file: `json`, `md` | `--export md` |
| `--pr <number>` | PR number for GitHub Actions mode | `--pr 142` |
| `--chunk-size <lines>` | Lines per chunk for large files (default: 50) | `--chunk-size 100` |
| `--help` | Display help information | `--help` |

### Examples

#### 🖥️ Terminal Output (Default)
```powershell
node code-review.js app.js
```
Shows colored review with severity badges and formatted issues.

#### 📋 JSON Format
```powershell
node code-review.js auth.py --format json
```
Machine-readable JSON for CI/CD integration or further processing.

#### 💾 Export to Markdown
```powershell
node code-review.js server.ts --export md
```
Creates `review-server-TIMESTAMP.md` with full report and metrics.

#### 🐙 GitHub PR Format
```powershell
node code-review.js api.go --format github --pr 85
```
Markdown output suitable for GitHub PR comments.

#### 🔍 Analyze with Custom Chunk Size
```powershell
node code-review.js large-file.java --chunk-size 100
```
Increases chunk size for better context (default is 50 lines).

---

## 📊 Output Formats

### 1. Terminal Output (Default)
```
================================================================================
📋 Code Review Report: app.js
================================================================================

🔴 Overall Risk: HIGH
Quality Score: 48/100 ███████░░░░░░░░░░░░░░

Summary:
The code has several HIGH severity security vulnerabilities and performance issues.

Issues Found (8):
🔴 High: 3 | 🟡 Medium: 3 | 🔵 Low: 2

━━━ HIGH SEVERITY ━━━

▸ SECURITY - SQL Injection vulnerability
  Line 5
  The query directly concatenates user input, allowing attack...
  💡 Fix: Use parameterized queries instead.

...

✓ Strengths:
  ● Good error handling structure
  ● Consistent naming conventions

📌 Recommendations:
  1. Replace string concatenation with parameterized queries
  2. Add input validation on all user inputs
  ...
```

### 2. JSON Format
```json
{
  "summary": "The code has security vulnerabilities...",
  "score": 48,
  "overall_risk": "HIGH",
  "issues": [
    {
      "severity": "HIGH",
      "category": "security",
      "line_number": 5,
      "title": "SQL Injection vulnerability",
      "explanation": "The query directly concatenates...",
      "suggested_fix": "Use parameterized queries..."
    }
  ],
  "strengths": ["Good error handling"],
  "recommendations": ["Fix SQL injection", "Add validation"]
}
```

### 3. Markdown Report
```markdown
# Code Review Report: app.js

**Date:** 3/15/2026, 10:30:45 AM
**Overall Risk:** HIGH
**Quality Score:** 48/100

## Summary

The code has several HIGH severity security vulnerabilities...

## Issues (8)

### 1. [HIGH] SQL Injection vulnerability
- **Category:** security
- **Line:** 5
- **Issue:** The query directly concatenates user input...
- **Fix:** Use parameterized queries instead.

...

## Strengths
- Good error handling structure
- Consistent naming conventions

## Recommendations
1. Replace string concatenation with parameterized queries
2. Add input validation on all user inputs
```

---

## 🔧 Configuration

### Supported Languages
Automatically detected by file extension:

```
JavaScript    .js, .jsx
TypeScript    .ts, .tsx
Python        .py
Java          .java
C++           .cpp
C             .c
C#            .cs
Go            .go
Rust          .rs
Ruby          .rb
PHP           .php
Swift         .swift
Kotlin        .kt
Scala         .scala
```

### Performance Settings

```javascript
// In code-review.js - CONFIG object
const CONFIG = {
  maxFileSize: 100000,      // Maximum file size in bytes (100KB)
  chunkSize: 50,            // Default lines per chunk
  supportedLanguages: { ... }
};
```

---

## 🐙 GitHub Actions Integration

### Automated PR Reviews

Create `.github/workflows/code-review.yml`:

```yaml
name: AI Code Review

on: [pull_request]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run code review
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
        run: |
          for file in $(git diff --name-only origin/main HEAD); do
            if [[ $file == *.js ]] || [[ $file == *.ts ]] || [[ $file == *.py ]]; then
              node code-review.js "$file" --format github
            fi
          done
```

### GitHub Secrets Setup
1. Go to repo Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GROQ_API_KEY`
4. Value: Your Groq API key
5. Click "Add secret"

---

## 🐛 Troubleshooting

### Error: "GROQ_API_KEY environment variable is not set"

**Solution:**
```powershell
# Option 1: Set in current session
$env:GROQ_API_KEY='gsk_YOUR_KEY'
node code-review.js file.js

# Option 2: Create .env file
echo "GROQ_API_KEY=gsk_YOUR_KEY" > .env
node code-review.js file.js

# Option 3: Permanent Windows environment variable
[System.Environment]::SetEnvironmentVariable('GROQ_API_KEY', 'gsk_YOUR_KEY', 'User')
```

### Error: "Unexpected token..is not valid JSON"

**Solution:**
The model may return explanatory text. This is fixed in v2.0+. Update your code:
```powershell
npm install
```

### Error: "Model xxx has been decommissioned"

**Solution:**
Groq occasionally retires models. Update to use the latest model in `code-review.js`:
- Current: `llama-3.3-70b-versatile`
- Check available models: [https://console.groq.com/docs/models](https://console.groq.com/docs/models)

### Review takes too long

**Solution:**
Reduce chunk size or file size:
```powershell
# Increase chunk size to reduce API calls
node code-review.js large-file.js --chunk-size 200
```

### Out of Free Tier Quota

**Solution:**
Groq free tier has usage limits. Options:
1. Wait for quota reset (typically daily)
2. Upgrade to Groq's Pro tier
3. Use alternative API (Claude, OpenAI, etc.)

---

## 📈 Analysis Details

### Security Scanning Detects
- SQL injection vulnerabilities
- Cross-site scripting (XSS) attacks
- Hardcoded credentials/secrets
- Insecure password storage
- Authentication bypass issues
- Unsafe deserialization
- Path traversal vulnerabilities
- CSRF protection gaps

### Performance Issues Detected
- Memory leaks and resource leaks
- Inefficient algorithms (O(n²) loops)
- N+1 query problems
- Missing database indexes
- Unnecessary object cloning
- Blocking operations
- Race conditions
- Inefficient string concatenation

### Code Quality Checks
- Missing error handling
- Poor variable naming
- Lack of code comments
- Inconsistent formatting
- Violated SOLID principles
- Missing type hints/annotations
- Magic numbers/strings
- Incomplete null checks

---

## 📦 Project Structure

```
.
├── code-review.js          # Main CLI application
├── package.json            # NPM configuration
├── package-lock.json       # Dependency lock file
├── .env                    # Environment variables (API key)
├── .env.example            # Template for .env
├── .github/workflows/      # GitHub Actions (optional)
│   └── code-review.yml    # Automated PR review workflow
├── README.md              # This file
└── sample_1.js            # Sample file for testing
```

---

## 🛠️ Development & Customization

### Modify Detection Logic

Edit the `systemPrompt` in `reviewCodeWithGroq()`:

```javascript
const systemPrompt = `You are an expert code reviewer...
// Add your custom instructions here
`;
```

### Change Temperature Setting

Adjust randomness (0.0 = deterministic, 1.0 = creative):

```javascript
temperature: 0.1,  // Lower = more consistent JSON output
```

### Add New Language Support

```javascript
const CONFIG = {
  supportedLanguages: {
    '.lua': 'Lua',
    '.sh': 'Bash',
    '.pl': 'Perl',
    // Add your language
  }
};
```

---

## 📜 License

MIT License - Feel free to use, modify, and distribute.

---

## 🤝 Contributing

Issues, suggestions, and pull requests welcome!

### Report Issues
Include:
- File type and language
- Error message or unexpected output
- Command used
- System info (Windows/Linux/Mac, Node version)

---

## 📚 Resources

- **Groq API Docs**: https://console.groq.com/docs
- **LLaMA 3.3 Guide**: https://github.com/meta-llama/llama3.3
- **Node.js Docs**: https://nodejs.org/docs
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 🎯 Roadmap

- [ ] Support for incremental reviews (cache previous results)
- [ ] Custom rule definitions via YAML config
- [ ] Database of common issues and fixes
- [ ] Integration with popular code editors (VS Code extension)
- [ ] Batch file analysis with CSV reports
- [ ] Cost tracking and quota management
- [ ] Support for additional AI providers (Claude, OpenAI, etc.)

---

## ⚡ Performance Tips

| File Size | Processing Time | Recommendation |
|-----------|-----------------|-----------------|
| < 50 lines | ~5s | Direct analysis |
| 50-500 lines | ~10-20s | Single API call |
| 500-2500 lines | ~30-60s | 5-25 chunks |
| > 2500 lines | ~2-5 min | 25+ chunks |

**Tips:**
1. Smaller files analyze faster
2. Use `--chunk-size` to balance speed vs. quality
3. Run batch reviews during off-peak hours
4. Cache results for unchanged files

---

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify Groq API key** is valid: https://console.groq.com/keys
3. **Ensure Node.js >= 18.0.0**: `node --version`
4. **Check internet connection** (API requires network)
5. **Review Groq status**: https://status.groq.com/

---

## 🚀 Getting Started in 3 Steps

```powershell
# 1. Get your free Groq API key
# Visit https://console.groq.com/keys

# 2. Configure it
echo "GROQ_API_KEY=gsk_YOUR_KEY" > .env

# 3. Analyze your code
node code-review.js your-file.js
```

That's it! 🎉

---

**Made with ❤️ using Groq AI**

*Last Updated: March 15, 2026*
