const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Spinner class
class Spinner {
  constructor(message) {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.currentFrame = 0;
    this.interval = null;
  }

  start() {
    process.stdout.write('\n');
    this.interval = setInterval(() => {
      process.stdout.write(`\r${colors.cyan}${this.frames[this.currentFrame]}${colors.reset} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  stop(finalMessage = '') {
    if (this.interval) {
      clearInterval(this.interval);
      process.stdout.write(`\r${' '.repeat(100)}\r`);
      if (finalMessage) {
        console.log(finalMessage);
      }
    }
  }
}

// Configuration
const CONFIG = {
  maxFileSize: 100000,
  chunkSize: 50, 
  supportedLanguages: {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
  }
};

// Pydantic-style schema definition for structured output
const REVIEW_SCHEMA = {
  name: 'CodeReviewResult',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Brief overall assessment of code quality'
      },
      score: {
        type: 'integer',
        description: 'Overall code quality score from 0-100',
        minimum: 0,
        maximum: 100
      },
      overall_risk: {
        type: 'string',
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        description: 'Overall risk level'
      },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: {
              type: 'string',
              enum: ['HIGH', 'MEDIUM', 'LOW'],
              description: 'Issue severity level'
            },
            category: {
              type: 'string',
              enum: ['security', 'performance', 'bug', 'style', 'best-practice'],
              description: 'Category of the issue'
            },
            line_number: {
              type: 'integer',
              description: 'Line number where issue occurs'
            },
            title: {
              type: 'string',
              description: 'Short title of the issue'
            },
            explanation: {
              type: 'string',
              description: 'Detailed explanation of the issue'
            },
            suggested_fix: {
              type: 'string',
              description: 'How to fix the issue'
            }
          },
          required: ['severity', 'category', 'line_number', 'title', 'explanation', 'suggested_fix']
        }
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Positive aspects found in the code'
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'General recommendations for improvement'
      }
    },
    required: ['summary', 'score', 'overall_risk', 'issues', 'strengths', 'recommendations']
  }
};

// Read file with chunking for large files
function readFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    return {
      content,
      size: stats.size,
      lines: content.split('\n').length
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

// Detect language
function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONFIG.supportedLanguages[ext] || 'Unknown';
}

// Smart chunking for large files (Challenge 1: Large diffs > context window)
function chunkCode(code, maxLines = CONFIG.chunkSize) {
  const lines = code.split('\n');
  
  if (lines.length <= maxLines) {
    return [{ content: code, startLine: 1, endLine: lines.length }];
  }

  const chunks = [];
  let currentChunk = [];
  let startLine = 1;
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentChunk.push(line);
    
    // Track brace depth to avoid breaking function boundaries
    braceDepth += (line.match(/{/g) || []).length;
    braceDepth -= (line.match(/}/g) || []).length;
    
    // Chunk when we hit size limit and are at function boundary
    if (currentChunk.length >= maxLines && braceDepth === 0) {
      chunks.push({
        content: currentChunk.join('\n'),
        startLine,
        endLine: i + 1
      });
      currentChunk = [];
      startLine = i + 2;
    }
  }
  
  // Add remaining lines
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join('\n'),
      startLine,
      endLine: lines.length
    });
  }
  
  return chunks;
}

async function reviewCodeWithGroq(code, language, fileName, options = {}) {
  const { startLine = 1, endLine = null, prMode = false } = options;
  
  const lineInfo = endLine ? `Lines ${startLine}-${endLine}` : 'Full file';
  
  const systemPrompt = `You are an expert code reviewer specializing in security, performance, and code quality analysis. 

Analyze the provided ${language} code and return a structured review following the exact schema provided.

Key focus areas:
1. SECURITY: SQL injection, XSS, authentication issues, insecure storage
2. PERFORMANCE: Algorithm complexity, memory leaks, inefficient operations
3. BUGS: Logic errors, edge cases, null/undefined handling, type issues
4. BEST PRACTICES: Design patterns, SOLID principles, naming conventions
5. CODE QUALITY: Readability, maintainability, documentation

${prMode ? 'This is for a Pull Request review - be constructive and actionable.' : ''}

Rate severity as:
- HIGH: Critical security vulnerabilities, major bugs, severe performance issues
- MEDIUM: Important improvements, potential bugs, moderate inefficiencies
- LOW: Minor style issues, suggestions for better practices

Provide specific line numbers, clear explanations, and actionable fixes.`;

  const userPrompt = `File: ${fileName}
${lineInfo}

\`\`\`${language.toLowerCase()}
${code}
\`\`\`

IMPORTANT: Return ONLY a valid JSON object, no other text before or after.

Return this exact JSON structure:
{
  "summary": "Brief overall assessment",
  "score": 75,
  "overall_risk": "HIGH|MEDIUM|LOW",
  "issues": [
    {
      "severity": "HIGH|MEDIUM|LOW",
      "category": "security|performance|bug|style|best-practice",
      "line_number": 10,
      "title": "Issue title",
      "explanation": "Detailed explanation",
      "suggested_fix": "How to fix it"
    }
  ],
  "strengths": ["Strength 1"],
  "recommendations": ["Recommendation 1"]
}`;


  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable not set');
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    const textContent = data.choices[0].message.content;

    // Extract and clean JSON
    let jsonString = textContent.trim();
    
    // Remove markdown code blocks
    jsonString = jsonString.replace(/```json\n?|\n?```/g, '');
    jsonString = jsonString.replace(/```\n?|\n?```/g, '');
    
    // Find the first { and last } to extract just the JSON object
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      if (process.env.DEBUG) {
        console.error('Response text:', textContent);
      }
      throw new Error('No valid JSON object found in response');
    }
    
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      if (process.env.DEBUG) {
        console.error('Failed to parse JSON:', jsonString);
      }
      throw new Error(`Invalid JSON in response: ${parseError.message}`);
    }
  } catch (error) {
    throw new Error(`Groq API error: ${error.message}`);
  }
}


function mergeReviews(reviews) {
  if (reviews.length === 1) return reviews[0];
  
  const merged = {
    summary: reviews.map(r => r.summary).join(' '),
    score: Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length),
    overall_risk: reviews.some(r => r.overall_risk === 'HIGH') ? 'HIGH' : 
                   reviews.some(r => r.overall_risk === 'MEDIUM') ? 'MEDIUM' : 'LOW',
    issues: [],
    strengths: [],
    recommendations: []
  };
  
  reviews.forEach(review => {
    merged.issues.push(...review.issues);
    merged.strengths.push(...review.strengths);
    merged.recommendations.push(...review.recommendations);
  });
  
  // Deduplicate
  merged.strengths = [...new Set(merged.strengths)];
  merged.recommendations = [...new Set(merged.recommendations)];
  
  return merged;
}

// Display review with enhanced formatting
function displayReview(review, fileName, options = {}) {
  const { outputFormat = 'terminal', prNumber = null } = options;
  
  if (outputFormat === 'json') {
    console.log(JSON.stringify(review, null, 2));
    return;
  }
  
  if (outputFormat === 'github') {
    displayGitHubFormat(review, fileName, prNumber);
    return;
  }
  
  // Terminal output
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}📋 Code Review Report: ${fileName}${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  // Risk badge
  const riskColors = {
    'HIGH': colors.red,
    'MEDIUM': colors.yellow,
    'LOW': colors.green
  };
  const riskIcons = {
    'HIGH': '🔴',
    'MEDIUM': '🟡',
    'LOW': '🟢'
  };
  
  console.log(`${riskIcons[review.overall_risk]} ${colors.bright}Overall Risk: ${riskColors[review.overall_risk]}${review.overall_risk}${colors.reset}`);
  
  // Score with visual bar
  const score = review.score;
  const scoreColor = score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red;
  const barLength = Math.round(score / 5);
  const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
  console.log(`${colors.bright}Quality Score: ${scoreColor}${score}/100 ${colors.dim}${bar}${colors.reset}\n`);

  // Summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`${review.summary}\n`);

  // Issues grouped by severity
  const issuesBySeverity = {
    HIGH: review.issues.filter(i => i.severity === 'HIGH'),
    MEDIUM: review.issues.filter(i => i.severity === 'MEDIUM'),
    LOW: review.issues.filter(i => i.severity === 'LOW')
  };
  
  console.log(`${colors.bright}Issues Found (${review.issues.length}):${colors.reset}`);
  console.log(`${colors.red}● High: ${issuesBySeverity.HIGH.length}${colors.reset} | ${colors.yellow}● Medium: ${issuesBySeverity.MEDIUM.length}${colors.reset} | ${colors.blue}● Low: ${issuesBySeverity.LOW.length}${colors.reset}\n`);

  // Display issues
  ['HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
    const issues = issuesBySeverity[severity];
    if (issues.length === 0) return;
    
    const severityColors = {
      HIGH: colors.red,
      MEDIUM: colors.yellow,
      LOW: colors.blue
    };
    
    console.log(`${severityColors[severity]}${colors.bright}━━━ ${severity} SEVERITY ━━━${colors.reset}\n`);
    
    issues.forEach((issue, index) => {
      console.log(`${severityColors[severity]}▸ ${issue.category.toUpperCase()}${colors.reset} - ${colors.bright}${issue.title}${colors.reset}`);
      console.log(`  ${colors.dim}Line ${issue.line_number}${colors.reset}`);
      console.log(`  ${issue.explanation}`);
      console.log(`  ${colors.green} Fix: ${issue.suggested_fix}${colors.reset}`);
      console.log('');
    });
  });

  // Strengths
  if (review.strengths.length > 0) {
    console.log(`${colors.bright}${colors.green}✓ Strengths:${colors.reset}`);
    review.strengths.forEach(strength => {
      console.log(`  ${colors.green}●${colors.reset} ${strength}`);
    });
    console.log('');
  }

  // Recommendations
  if (review.recommendations.length > 0) {
    console.log(`${colors.bright}${colors.cyan}📌 Recommendations:${colors.reset}`);
    review.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }

  console.log('='.repeat(80) + '\n');
}

// GitHub Actions format output
function displayGitHubFormat(review, fileName, prNumber) {
  console.log('\n## AI Code Review Report\n');
  console.log(`**File:** \`${fileName}\``);
  console.log(`**Overall Risk:** ${review.overall_risk === 'HIGH' ? '🔴' : review.overall_risk === 'MEDIUM' ? '🟡' : '🟢'} ${review.overall_risk}`);
  console.log(`**Quality Score:** ${review.score}/100\n`);
  
  console.log(`### Summary\n${review.summary}\n`);
  
  if (review.issues.length > 0) {
    console.log(`### Issues Found (${review.issues.length})\n`);
    
    ['HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
      const issues = review.issues.filter(i => i.severity === severity);
      if (issues.length === 0) return;
      
      const icon = severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🔵';
      console.log(`#### ${icon} ${severity} Severity\n`);
      
      issues.forEach(issue => {
        console.log(`**${issue.category}** - ${issue.title} _(Line ${issue.line_number})_`);
        console.log(`- ${issue.explanation}`);
        console.log(`-  **Fix:** ${issue.suggested_fix}\n`);
      });
    });
  }
  
  if (review.strengths.length > 0) {
    console.log(`### ✅ Strengths\n`);
    review.strengths.forEach(s => console.log(`- ${s}`));
    console.log('');
  }
  
  if (review.recommendations.length > 0) {
    console.log(`### 📋 Recommendations\n`);
    review.recommendations.forEach(r => console.log(`- ${r}`));
    console.log('');
  }
}

// Export review to file
function exportReview(review, fileName, format = 'json') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = `review-${path.basename(fileName, path.extname(fileName))}-${timestamp}.${format}`;
  
  let content;
  if (format === 'json') {
    content = JSON.stringify(review, null, 2);
  } else if (format === 'md') {
    content = generateMarkdownReport(review, fileName);
  }
  
  fs.writeFileSync(outputFile, content);
  console.log(`${colors.green}✓ Review exported to: ${outputFile}${colors.reset}\n`);
}

// Generate markdown report
function generateMarkdownReport(review, fileName) {
  let md = `# Code Review Report: ${fileName}\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Overall Risk:** ${review.overall_risk}\n`;
  md += `**Quality Score:** ${review.score}/100\n\n`;
  md += `## Summary\n\n${review.summary}\n\n`;
  md += `## Issues (${review.issues.length})\n\n`;
  
  review.issues.forEach((issue, i) => {
    md += `### ${i + 1}. [${issue.severity}] ${issue.title}\n\n`;
    md += `- **Category:** ${issue.category}\n`;
    md += `- **Line:** ${issue.line_number}\n`;
    md += `- **Issue:** ${issue.explanation}\n`;
    md += `- **Fix:** ${issue.suggested_fix}\n\n`;
  });
  
  if (review.strengths.length > 0) {
    md += `## Strengths\n\n`;
    review.strengths.forEach(s => md += `- ${s}\n`);
    md += '\n';
  }
  
  if (review.recommendations.length > 0) {
    md += `## Recommendations\n\n`;
    review.recommendations.forEach(r => md += `- ${r}\n`);
    md += '\n';
  }
  
  return md;
}

// Help text
function displayHelp() {
  console.log(`
${colors.bright}${colors.cyan}AI-Powered Code Review CLI v2.0 (Groq API)${colors.reset}

${colors.bright}Usage:${colors.reset}
  node code-review.js <file> [options]

${colors.bright}Environment Variables:${colors.reset}
  GROQ_API_KEY          Your Groq API key (required)

${colors.bright}Options:${colors.reset}
  --pr <number>         Pull request number (GitHub Actions mode)
  --format <type>       Output format: terminal, json, github (default: terminal)
  --export <format>     Export review to file: json, md
  --chunk-size <lines>  Lines per chunk for large files (default: 50)

${colors.bright}Examples:${colors.reset}
  GROQ_API_KEY=xxx node code-review.js app.js
  GROQ_API_KEY=xxx node code-review.js src/auth.py --format json
  GROQ_API_KEY=xxx node code-review.js server.js --export md
  GROQ_API_KEY=xxx node code-review.js api.ts --pr 142 --format github

${colors.bright}Features:${colors.reset}
  ✓ Structured output with schema enforcement
  ✓ Severity-based issue classification (HIGH/MEDIUM/LOW)
  ✓ Smart chunking for large files
  ✓ GitHub Actions integration
  ✓ Multiple output formats (terminal, JSON, markdown)
  ✓ Export reports for documentation
  ✓ Powered by Groq's fast LLM inference
  `);
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(0);
  }

  // Parse arguments
  const filePath = args[0];
  const prNumber = args.includes('--pr') ? args[args.indexOf('--pr') + 1] : null;
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'terminal';
  const exportFormat = args.includes('--export') ? args[args.indexOf('--export') + 1] : null;
  const chunkSize = args.includes('--chunk-size') ? parseInt(args[args.indexOf('--chunk-size') + 1]) : CONFIG.chunkSize;

  // Validate file
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  const fileName = path.basename(filePath);
  const language = detectLanguage(filePath);

  if (language === 'Unknown') {
    console.warn(`${colors.yellow}Warning: Unknown file type. Proceeding anyway...${colors.reset}`);
  }

  console.log(`${colors.cyan}Analyzing ${fileName} (${language})...${colors.reset}`);

  const spinner = new Spinner('Running AI code review with structured output...');
  spinner.start();

  try {
    // Read file
    const fileData = readFileContent(filePath);
    
    // Handle large files with chunking
    const chunks = chunkCode(fileData.content, chunkSize);
    
    if (chunks.length > 1) {
      console.log(`\n${colors.yellow}Large file detected. Analyzing in ${chunks.length} chunks...${colors.reset}`);
    }
    
    // Review each chunk
    const reviews = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      spinner.stop();
      if (chunks.length > 1) {
        console.log(`${colors.dim}Analyzing chunk ${i + 1}/${chunks.length} (lines ${chunk.startLine}-${chunk.endLine})...${colors.reset}`);
      }
      spinner.start();
      
      const review = await reviewCodeWithGroq(
        chunk.content, 
        language, 
        fileName,
        {
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          prMode: prNumber !== null
        }
      );
      reviews.push(review);
    }
    
    // Merge reviews if chunked
    const finalReview = mergeReviews(reviews);

    spinner.stop(`${colors.green}✓ Review complete!${colors.reset}`);

    // Display results
    displayReview(finalReview, fileName, { 
      outputFormat: format, 
      prNumber 
    });
    
    // Export if requested
    if (exportFormat) {
      exportReview(finalReview, fileName, exportFormat);
    }

  } catch (error) {
    spinner.stop(`${colors.red}✗ Review failed${colors.reset}`);
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}\n`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
