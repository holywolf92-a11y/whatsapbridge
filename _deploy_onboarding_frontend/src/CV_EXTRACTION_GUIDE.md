# CV Extraction & AI Parsing - Complete Guide

## 🎯 Overview

This feature automatically extracts candidate information from CVs received via **WhatsApp**, **Email**, or **Web Forms** using **OpenAI's GPT API**.

---

## 📋 Workflow

### Step 1: CV Inbox
- All incoming CVs appear in the **CV Inbox** page
- Shows CVs from 3 sources:
  - 📱 **WhatsApp** - CVs sent to your WhatsApp business number
  - 📧 **Email** - CVs sent to your recruitment email
  - 🌐 **Web Form** - CVs uploaded via the public application form

### Step 2: AI Extraction
Click **"Extract Data"** on any CV to:
1. Read the CV file (PDF/DOC/DOCX)
2. Send to OpenAI API for processing
3. Extract structured candidate information
4. Show confidence scores for accuracy

### Step 3: Review & Edit
- AI shows extracted data in an organized form
- **Confidence Score** tells you how accurate the extraction is
- **Edit Mode** lets you correct any mistakes
- Review all fields before saving

### Step 4: Save to Candidates
- Click **"Save to Candidates"**
- Original CV file is attached to the candidate profile
- Candidate appears in Candidate Management
- Ready for job matching and employer sharing

---

## 🔧 Technical Setup

### OpenAI API Integration

**Location to add API call:** `/components/CVParser.tsx`

Replace the `mockExtractData()` function with actual OpenAI API call:

```typescript
async function extractDataFromCV(file: File): Promise<ExtractedData> {
  // 1. Convert PDF/DOC to text
  const cvText = await extractTextFromFile(file);
  
  // 2. Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a CV parser. Extract the following information from the CV text and return as JSON:
          - name (full name)
          - email (email address)
          - phone (phone number with country code)
          - nationality (country of citizenship)
          - age (age in years)
          - position (current job title or desired position)
          - experience (years of experience as a number)
          - countryOfInterest (where they want to work)
          - skills (comma-separated list)
          - languages (comma-separated list)
          - education (highest education)
          - certifications (comma-separated list)
          - previousEmployment (brief work history)
          - passportNumber (if mentioned)
          - passportExpiry (if mentioned, in YYYY-MM-DD format)
          - summary (2-3 sentence professional summary)
          
          Return ONLY valid JSON. If information is not found, use empty string.`
        },
        {
          role: 'user',
          content: cvText
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });
  
  const data = await response.json();
  const extracted = JSON.parse(data.choices[0].message.content);
  
  // 3. Calculate confidence scores
  const confidence = calculateConfidence(extracted);
  
  return {
    ...extracted,
    confidence
  };
}
```

### PDF/DOC Text Extraction

Use libraries like:
- **pdf-parse** for PDFs
- **mammoth** for DOCX files

```bash
npm install pdf-parse mammoth
```

```typescript
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  if (file.name.endsWith('.pdf')) {
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  } 
  else if (file.name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return result.value;
  }
  
  throw new Error('Unsupported file type');
}
```

---

## 📱 WhatsApp Integration

### Option 1: WhatsApp Business API

Use **Twilio** or **MessageBird** to receive CVs:

```typescript
// Webhook endpoint to receive WhatsApp messages
app.post('/webhook/whatsapp', async (req, res) => {
  const { From, MediaUrl0, Body } = req.body;
  
  if (MediaUrl0) {
    // Download CV file
    const cvFile = await downloadFile(MediaUrl0);
    
    // Save to CV Inbox
    await saveToInbox({
      fileName: 'CV.pdf',
      source: 'WhatsApp',
      senderContact: From,
      file: cvFile
    });
    
    // Auto-reply
    await sendWhatsAppMessage(From, 
      '✅ Thank you! We received your CV and will review it shortly.'
    );
  }
  
  res.sendStatus(200);
});
```

### Option 2: WhatsApp Web Automation

Use **whatsapp-web.js** to monitor messages:

```typescript
const { Client } = require('whatsapp-web.js');

const client = new Client();

client.on('message', async (msg) => {
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    
    if (media.mimetype.includes('pdf') || media.mimetype.includes('document')) {
      // Save to CV Inbox
      await saveToInbox({
        fileName: media.filename || 'CV.pdf',
        source: 'WhatsApp',
        senderName: msg._data.notifyName,
        senderContact: msg.from,
        file: Buffer.from(media.data, 'base64')
      });
      
      msg.reply('✅ CV received! We will process it shortly.');
    }
  }
});

client.initialize();
```

---

## 📧 Email Integration

### Using Gmail API

```typescript
import { google } from 'googleapis';

async function checkEmailForCVs() {
  const gmail = google.gmail({ version: 'v1', auth: YOUR_OAUTH_CLIENT });
  
  // Search for emails with PDF attachments
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'has:attachment filename:pdf OR filename:doc OR filename:docx'
  });
  
  for (const message of res.data.messages || []) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: message.id
    });
    
    // Extract attachment
    for (const part of msg.data.payload.parts || []) {
      if (part.filename && part.body.attachmentId) {
        const attachment = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: message.id,
          id: part.body.attachmentId
        });
        
        // Save to CV Inbox
        await saveToInbox({
          fileName: part.filename,
          source: 'Email',
          senderName: extractSenderName(msg.data.payload.headers),
          senderContact: extractSenderEmail(msg.data.payload.headers),
          file: Buffer.from(attachment.data.data, 'base64')
        });
      }
    }
  }
}

// Run every 5 minutes
setInterval(checkEmailForCVs, 5 * 60 * 1000);
```

---

## 💾 File Storage

### Save Original CVs

Use **Supabase Storage** or **AWS S3**:

```typescript
// Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveCV(file: File, candidateId: string) {
  const fileName = `cvs/${candidateId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('candidate-documents')
    .upload(fileName, file);
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('candidate-documents')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}
```

---

## 🎯 Extracted Data Fields

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Full name | Ahmed Hassan |
| `email` | Email address | ahmed@email.com |
| `phone` | Phone with country code | +92 300 1234567 |
| `nationality` | Country of citizenship | Pakistani |
| `age` | Age in years | 32 |
| `position` | Job title/role | Construction Worker |
| `experience` | Years of experience | 5 |
| `countryOfInterest` | Where they want to work | Saudi Arabia |
| `skills` | Comma-separated skills | Masonry, Carpentry, Safety |
| `languages` | Comma-separated languages | Urdu, English, Arabic |
| `education` | Highest education | Matric (10th Grade) |
| `certifications` | Certifications/licenses | Safety Certificate |
| `previousEmployment` | Work history | ABC Company (2018-2023) |
| `passportNumber` | Passport number | AB1234567 |
| `passportExpiry` | Expiry date | 2027-12-31 |
| `summary` | Professional summary | Experienced worker... |

---

## 🔐 Security & Privacy

### Best Practices:

1. **Encrypt stored CVs** at rest
2. **Use HTTPS** for all API calls
3. **Secure API keys** in environment variables
4. **GDPR Compliance** - Allow candidates to request deletion
5. **Access Control** - Only authorized staff can view CVs
6. **Audit Logs** - Track who accessed which CVs

---

## 📊 Confidence Scoring

The AI provides confidence scores to help you trust the extraction:

- **90-100%** - Very High (Green) - Safe to auto-save
- **80-89%** - High (Blue) - Review recommended
- **70-79%** - Medium (Yellow) - Manual review required
- **Below 70%** - Low (Red) - Manual data entry needed

---

## 🚀 Production Deployment

### Environment Variables:

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
WHATSAPP_PHONE_NUMBER=+92...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

### Recommended Stack:

- **Frontend:** React (current)
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage or AWS S3
- **AI Processing:** OpenAI GPT-4
- **WhatsApp:** Twilio or whatsapp-web.js
- **Email:** Gmail API or SendGrid

---

## 💰 Cost Estimation

### OpenAI API Costs:

- **GPT-4 Turbo:** ~$0.03 per CV (3,000 tokens avg)
- **GPT-3.5 Turbo:** ~$0.003 per CV (cheaper, less accurate)

For 1,000 CVs/month:
- GPT-4: ~$30/month
- GPT-3.5: ~$3/month

### Recommended:
Start with **GPT-4** for high accuracy, switch to **GPT-3.5** if budget is tight.

---

## 🎓 Training Tips

### Improve AI Accuracy:

1. **Fine-tune prompts** based on your CVs
2. **Provide examples** in the system prompt
3. **Use JSON mode** for structured output
4. **Add validation** for phone/email formats
5. **Train on your CV formats** if using fine-tuning

---

## 📞 Support

For implementation help:
- Check OpenAI documentation: https://platform.openai.com/docs
- Twilio WhatsApp API: https://www.twilio.com/whatsapp
- Gmail API: https://developers.google.com/gmail/api

---

## ✅ Next Steps

1. Set up OpenAI API key
2. Configure WhatsApp webhook
3. Set up Gmail API
4. Test with sample CVs
5. Review and adjust AI prompts
6. Deploy to production
7. Monitor accuracy and costs
