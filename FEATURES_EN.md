# Hotker Prompt Studio - Feature Details

## 📋 Table of Contents

1. [Version Control](#version-control)
2. [Collaboration & Sharing](#collaboration--sharing)
3. [AI-Powered Optimization](#ai-powered-optimization)

---

## 📜 Version Control

### Overview

Automatically track every modification of prompt modules, supporting version tagging, comparison, and restoration.

### Key Features

- ✅ **Auto Versioning**: Automatically create new versions when saving edits
- ✅ **Version Tagging**: Support semantic versioning (v1.0, v2.0-beta, etc.)
- ✅ **Change Description**: Record the purpose and content of each modification
- ✅ **Quick Restore**: One-click restore to any historical version
- ✅ **Version Comparison**: View differences between versions

### Use Cases

1. **Iterative Optimization**: Test different versions' effectiveness, keep the best
2. **Error Recovery**: Quickly rollback after accidental modifications
3. **Team Collaboration**: Track who made what changes when
4. **Learning & Growth**: View the evolution of your prompts

### User Guide

#### Creating Versions

1. Edit prompt module
2. Fill in "Change Description" before saving (optional)
3. Click "Save" to automatically create new version

#### Viewing History

1. Hover over module card
2. Click yellow "clock" icon
3. View all historical versions

#### Version Tagging

1. Find target version in version history
2. Click "Tag Version" button
3. Enter version number (e.g., v1.0)

#### Restoring Versions

1. Select target version in version history
2. Click "Restore This Version"
3. Confirm to automatically restore (creates new version)

### Data Structure

```typescript
interface ModuleVersion {
  id: string;
  moduleId: string;
  versionNumber: number;
  content: PromptModule;
  userId: string;
  changeSummary?: string;
  versionTag?: string;
  createdAt: number;
}
```

---

## 🤝 Collaboration & Sharing

### Overview

Securely share your prompt modules by generating share links or short codes.

### Key Features

- ✅ **Multiple Sharing Methods**: Links, 12-digit short codes, QR codes
- ✅ **Security Protection**: Optional password protection
- ✅ **Flexible Expiration**: 1/7/30 days or never expire
- ✅ **Usage Statistics**: Access count and import count
- ✅ **Data Snapshot**: Save data copy when sharing, won't affect original data

### Use Cases

1. **Team Collaboration**: Share with team members
2. **Community Contribution**: Share quality prompts to community
3. **Client Delivery**: Deliver customized prompt solutions
4. **Teaching & Training**: Share example prompts with students

### User Guide

#### Creating Shares

1. Hover over module card
2. Click blue "share" icon
3. Set password (optional)
4. Select expiration time
5. Click "Create Share"
6. Copy link or share code

#### Importing Shares

1. Click green "Import Prompt" button in header
2. Paste share link or enter share code
3. Enter password if required
4. Click "Import"
5. Prompt automatically added to library

### Share Link Format

```
Full Link: http://localhost:3000/share/a1b2c3d4e5f6
Short Code: a1b2c3d4e5f6
```

### Security Notes

- Password is Base64 encoded (recommend upgrading to bcrypt for production)
- Sharing creates data snapshot, won't affect original data
- After expiration, share becomes invalid and inaccessible
- Can delete share at any time

### API Examples

```bash
# Create share
curl -X POST http://localhost:3000/api/shares/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "shareType": "module",
    "title": "My Prompt",
    "data": {...},
    "password": "optional_password",
    "expiresInDays": 7
  }'

# Access share
curl -X POST http://localhost:3000/api/shares/access \
  -H "Content-Type: application/json" \
  -d '{
    "shareKey": "a1b2c3d4e5f6",
    "password": "optional_password"
  }'
```

---

## 🤖 AI-Powered Optimization

### Overview

Intelligent prompt analysis and optimization system based on Gemini 2.0 Flash Exp.

### Key Features

- ✅ **Quality Analysis**: 4-dimension scoring (Clarity, Specificity, Structure, Completeness)
- ✅ **Issue Identification**: Automatically discover potential problems in prompts
- ✅ **Improvement Suggestions**: Provide specific optimization recommendations
- ✅ **Auto Optimization**: AI automatically generates optimized prompts
- ✅ **Comparison Preview**: Side-by-side display of original and optimized versions

### Use Cases

1. **Quality Assessment**: Evaluate professionalism of prompts
2. **Problem Diagnosis**: Identify unclear or ambiguous expressions
3. **Quick Optimization**: AI-assisted prompt improvement
4. **Learning Enhancement**: Understand characteristics of excellent prompts

### User Guide

#### Analyzing Quality

1. Assemble prompts in "Prompt Engineering"
2. Click purple "Analyze Quality" button
3. Wait for AI analysis (3-5 seconds)
4. View scoring results:
   - Overall score
   - Dimension scores
   - Identified issues
   - Improvement suggestions

#### Smart Optimization

1. Assemble prompts as above
2. Click yellow "Smart Optimize" button
3. Wait for AI optimization (5-8 seconds)
4. View comparison results
5. Click "Accept & Apply" to use optimized version

### Scoring Criteria

**Overall Score**: 0-100 points
- 90-100: Excellent
- 80-89: Good
- 60-79: Fair
- <60: Needs Improvement

**Dimension Descriptions**:

1. **Clarity**
   - Are instructions clear and explicit?
   - Can users understand expected output?
   - Avoid vague or ambiguous expressions

2. **Specificity**
   - Are sufficient details provided?
   - Are constraints clearly defined?
   - Avoid over-generalization

3. **Structure**
   - Is there good organizational structure?
   - Is logic clear?
   - Is it easy to understand and execute?

4. **Completeness**
   - Is necessary context included?
   - Is critical information missing?
   - Does it meet task requirements?

### Best Practices

#### Good Prompt Characteristics

```
Role Definition ✅
You are a professional tech writer skilled at explaining complex technical concepts in simple terms.

Task Description ✅
Please write an article about artificial intelligence.

Constraints ✅
- Article length: 800-1000 words
- Target audience: General public
- Writing style: Easy to understand

Output Format ✅
Please use Markdown format, including:
1. Introduction
2. Main body (at least 3 key points)
3. Conclusion
```

#### Prompts Needing Improvement

```
❌ Write an article about AI
(Missing role definition, specific requirements, output format)

✅ Improved:
You are a professional tech writer...
(Complete role, task, constraints, format)
```

### Cost Information

**Single Analysis**:
- Input: ~200 tokens
- Output: ~300 tokens
- Cost: ~$0.001

**Single Optimization**:
- Input: ~250 tokens
- Output: ~500 tokens
- Cost: ~$0.002

**Recommendations**:
- Use reasonably, avoid frequent calls
- Can use your own Gemini API Key
- Consider implementing result caching

### Technical Implementation

#### Analysis Prompt Template

```
You are a professional prompt engineer. Please analyze the quality of the following prompt...

Dimension Analysis:
1. Clarity: Are instructions clear and explicit?
2. Specificity: Are sufficient details provided?
3. Structure: Is there good organizational structure?
4. Completeness: Is necessary context included?

Output Format (JSON):
{
  "overallScore": 85,
  "dimensions": {...},
  "issues": [...],
  "suggestions": [...]
}
```

#### Optimization Prompt Template

```
You are a professional prompt engineer. Please optimize the following prompt...

Optimization Requirements:
1. Ensure clear role definition
2. Specific and clear task description
3. Add necessary constraints
4. Clarify output format
5. Keep original meaning, only improve expression
```

### API Examples

```bash
# Analyze prompt
curl -X POST http://localhost:3000/api/optimize/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Your prompt content",
    "apiKey": "Your Gemini API Key"
  }'

# Optimize prompt
curl -X POST http://localhost:3000/api/optimize/improve \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Your prompt content",
    "apiKey": "Your Gemini API Key"
  }'
```

---

## 🎓 Learning Resources

### Prompt Engineering Best Practices

1. **Define Role**: Tell AI what role it should play
2. **Specific Task**: Clearly describe the task to complete
3. **Set Constraints**: Limit output length, format, style, etc.
4. **Provide Examples**: Few-shot learning improves effectiveness
5. **Clarify Format**: Specify output format (JSON, Markdown, etc.)

### Recommended Reading

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Google Gemini Best Practices](https://ai.google.dev/docs/prompt_best_practices)
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)

### Community

- GitHub Discussions
- X (Twitter): @hotker_ai
- Discord (Coming Soon)

---

## 🚀 Quick Start

1. **Deploy Application** - Refer to README.md
2. **Configure API Key** - Get Gemini API Key
3. **Create First Module** - Go to Prompt Library
4. **Try Smart Optimization** - Use AI analysis feature
5. **Share with Friends** - Use sharing feature

---

## ❓ FAQ

### Q: Is it free?
A: The application itself is free and open source. Only requires Gemini API Key, Google provides free tier.

### Q: Is data secure?
A: With Docker deployment, data is stored in local SQLite, completely private. Sharing feature uses data snapshots, won't affect original data.

### Q: Does it support other AI models?
A: Currently optimized for Gemini, may support more models in the future.

### Q: Can I use it commercially?
A: MIT License, free for commercial use. But please comply with Google Gemini's terms of use.

---

© 2025 Hotker Prompt Studio. All rights reserved.
