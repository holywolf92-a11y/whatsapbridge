# Nationality Detection Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CV PARSING PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

1. INPUT STAGE
┌─────────────────────┐
│  CV File Upload     │
│  (PDF/DOCX)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Text Extraction    │
│  (PyPDF2/DOCX lib)  │
└──────────┬──────────┘
           │
           ▼
2. INITIAL PARSING
┌─────────────────────────────────────────┐
│  OpenAI GPT-4o-mini Parse               │
│  ✓ Name, Email, Phone                   │
│  ✓ Education, Work Experience           │
│  ✓ Languages, Skills                    │
│  ✓ (Try) Nationality                    │
└──────────┬────────────────────────────────┘
           │
           ▼
3. NATIONALITY ENHANCEMENT (NEW!)
┌──────────────────────────────────────────────────────────┐
│            ENHANCE_NATIONALITY_WITH_AI()                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  A. Check if Explicit ───────────┐                      │
│     (confidence > 0.8)           │                      │
│                                  ├─ YES ──┐             │
│  B. Rule-Based Detection ────────┤        │             │
│     • Check universities         │        │             │
│     • Check cities               │        │             │
│     • Check languages            │        │             │
│     • Check passport codes       │        │             │
│                                  ├─ HIGH CONF ─────┐    │
│  C. AI Enhancement ──────────────┤                 │    │
│     (if confidence < 0.70)       │                 │    │
│                                  ├─ LOW CONF ──┐   │    │
│                                                │   │    │
└────────────────────────────────────────────────┼───┼────┘
                                                 │   │
                                    ┌────────────┴───┴──────┐
                                    │                       │
                                    ▼                       ▼
                            ┌──────────────┐      ┌──────────────┐
                            │ Return Result│      │ Use AI       │
                            │ (Confidence  │      │ Analysis     │
                            │ >= 0.70)     │      │              │
                            └──────┬───────┘      └──────┬───────┘
                                   │                     │
                                   └────────┬────────────┘
                                            │
                                            ▼
4. OUTPUT STAGE
┌──────────────────────────────────────────────────┐
│  Enhanced CV Data                                │
│  ├─ nationality: "Pakistan"                      │
│  ├─ nationality_inferred_from: "education (Pak)"│
│  ├─ extraction_confidence.nationality: 0.80     │
│  └─ [All other CV fields]                        │
└──────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│  Store in Database / Return to Backend           │
└──────────────────────────────────────────────────┘
```

## Decision Tree for Nationality Detection

```
START: Parse CV
│
├─ Is "Nationality:" field explicitly stated?
│  ├─ YES → Return explicit nationality (0.95+ confidence) ✓
│  │
│  └─ NO → Continue to next check
│
├─ Is there a passport number?
│  ├─ YES → Check country code (PA=Pakistan, IN=India, etc.)
│  │   ├─ YES → Return passport country (0.90+ confidence) ✓
│  │   └─ NO → Continue
│  │
│  └─ NO → Continue to next check
│
├─ Check Education Location (PRIMARY INDICATOR)
│  ├─ Pakistani University? (FAST, COMSATS, LUMS, etc.)
│  │  ├─ YES → Return Pakistan (0.78-0.85 confidence) ✓
│  │  └─ NO → Continue
│  │
│  ├─ Indian University? (IIT, Delhi, Mumbai, etc.)
│  │  ├─ YES → Return India (0.70-0.78 confidence) ✓
│  │  └─ NO → Continue
│  │
│  └─ Other country university?
│     ├─ YES → Return that country (0.70-0.78 confidence) ✓
│     └─ NO → Continue
│
├─ Check Work Experience (SECONDARY INDICATOR)
│  ├─ Count Pakistani cities (Karachi, Lahore, Islamabad)
│  │  ├─ 2+ cities → Pakistan (0.70-0.75 confidence) ✓
│  │  └─ < 2 → Continue
│  │
│  └─ Count Indian/other cities
│     ├─ 2+ cities → That country (0.65-0.70 confidence) ✓
│     └─ < 2 → Continue
│
├─ Check Language Skills
│  ├─ Urdu language?
│  │  ├─ YES → Likely Pakistan (0.65-0.70 confidence) ✓
│  │  └─ NO → Continue
│  │
│  └─ Hindi language?
│     ├─ YES → Likely India (0.60-0.65 confidence) ✓
│     └─ NO → Continue
│
└─ Use AI Analysis (OpenAI)
   └─ Analyze all fields, provide intelligent inference ✓

END: Return nationality with confidence score & source
```

## Rule-Based Detection Flowchart

```
┌────────────────────────────────────────┐
│ EDUCATION ANALYSIS                     │
├────────────────────────────────────────┤
│                                        │
│  Education Contains:                  │
│  └─ FAST-NUCES, COMSATS, LUMS, etc.   │
│     └─ Match Found?                   │
│        ├─ YES → confidence = 0.80 ✓   │
│        └─ NO → Check work locations   │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ WORK LOCATION ANALYSIS                 │
├────────────────────────────────────────┤
│                                        │
│  Work Countries:                       │
│  ├─ Primary: [Extract from jobs]       │
│  ├─ Secondary: [All countries]         │
│  │                                     │
│  └─ Count Pakistan indicators          │
│     ├─ 2+ cities → confidence = 0.72 ✓ │
│     ├─ 1 city → confidence = 0.65      │
│     └─ 0 cities → Check languages      │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ LANGUAGE ANALYSIS                      │
├────────────────────────────────────────┤
│                                        │
│  Languages List:                       │
│  ├─ Contains "Urdu"?                   │
│  │  └─ YES → confidence = 0.68 ✓       │
│  │                                     │
│  └─ Contains "Hindi"?                  │
│     └─ YES → confidence = 0.65 ✓       │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ CONFIDENCE DECISION                    │
├────────────────────────────────────────┤
│                                        │
│  Confidence >= 0.70?                   │
│  ├─ YES → Return result ✓              │
│  │                                     │
│  └─ NO → Use AI analysis (OpenAI)      │
│                                        │
└────────────────────────────────────────┘
```

## Data Flow for Rizwan Ali

```
┌─────────────────────────────────────────────────────────┐
│                 RIZWAN ALI CV INPUT                     │
├─────────────────────────────────────────────────────────┤
│ Name: Rizwan Ali                                        │
│ Email: rizwankaramat989@gmail.com                       │
│ Education: BS CS from FAST-NUCES, Islamabad            │
│ Work: 2019-2021 TCS Pakistan                            │
│       2021-2024 DHA Islamabad                           │
│ Languages: Urdu, English                                │
│ Nationality: [MISSING]                                  │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
        ┌─────────────────────┐
        │ PARSING WITH        │
        │ ENHANCED PROMPT     │
        │ (Better extraction) │
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ INITIAL NATIONALITY CHECK    │
        │ "Nationality:" field?        │
        │ Result: NOT FOUND            │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ RULE-BASED DETECTION         │
        │                              │
        │ 1. Check education:          │
        │    FAST-NUCES?               │
        │    ✓ YES → Pakistan          │
        │    Confidence: 0.80          │
        │                              │
        │ 2. Verify with work:         │
        │    TCS Pakistan + DHA        │
        │    ✓ Confirms Pakistan       │
        │                              │
        │ 3. Check language:           │
        │    Urdu present?             │
        │    ✓ Confirms Pakistan       │
        │                              │
        │ Final Confidence: 0.80       │
        └──────────┬───────────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ Decision: confidence 0.80   │
      │ >= threshold 0.70?          │
      │ ✓ YES - Return result       │
      └──────────┬─────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│        ENHANCED CV OUTPUT                    │
├─────────────────────────────────────────────┤
│ {                                           │
│   "nationality": "Pakistan",                │
│   "nationality_inferred_from": "education  │
│                                (Pakistan)", │
│   "primary_education_country": "Pakistan",  │
│   "primary_work_countries": ["Pakistan"],   │
│   "languages": ["Urdu", "English"],         │
│   "extraction_confidence": {                │
│     "nationality": 0.80                     │
│   },                                        │
│   ... [other CV fields]                     │
│ }                                           │
└─────────────────────────────────────────────┘
```

## Confidence Progression

```
RIZWAN ALI NATIONALITY DETECTION CONFIDENCE BUILD-UP

0.00 ├─ Starting point (unknown)
     │
0.20 ├─ Random guess
     │
0.40 ├─ Based on country_of_interest (if set)
     │
0.60 ├─ Based on one indicator
     │  └─ Work location alone: 0.65
     │  └─ Language alone: 0.65
     │
0.75 ├─ Based on primary indicator
     │  ├─ Education location: 0.78 ◄─ RIZWAN ALI (FAST-NUCES)
     │  └─ Passport code: 0.90
     │
0.90 ├─ Multiple strong confirmations
     │  ├─ Education (0.78) + Work (0.72) + Language (0.68)
     │  └─ Explicit statement: 0.95+
     │
1.00 ├─ 100% certain
     │  └─ Only for explicitly stated nationality

RIZWAN ALI RESULT: 0.80 (High confidence, education-based)
```

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│              MAIN.PY INTEGRATION                        │
└─────────────────────────────────────────────────────────┘

API ENDPOINT: POST /parse-cv
        │
        ├─► parse_cv_with_openai()
        │    ├─ Extract text from PDF
        │    ├─ Call OpenAI with enhanced prompt
        │    ├─ Parse JSON response
        │    ├─ Post-process data
        │    ├─► enhance_nationality_with_ai()  ◄─ NEW!
        │    │    └─ Returns enhanced data
        │    │
        │    └─ Return enhanced CV data
        │
        └─► parse_cv_with_vision()
             ├─ Convert PDF to images
             ├─ Call OpenAI vision API
             ├─ Parse JSON response
             ├─ Post-process data
             ├─► enhance_nationality_with_ai()  ◄─ NEW!
             │    └─ Returns enhanced data
             │
             └─ Return enhanced CV data

DATABASE STORAGE: inbox_attachments
        │
        ├─ extracted_data includes:
        │  ├─ nationality: "Pakistan"
        │  ├─ nationality_inferred_from: "education (Pakistan)"
        │  └─ extraction_confidence.nationality: 0.80
        │
        └─ Used by downstream processes
```

## File Dependencies

```
┌──────────────────────────────────────────┐
│        PYTHON PARSER MODULE STRUCTURE     │
├──────────────────────────────────────────┤
│                                          │
│  main.py                                 │
│  ├─ FastAPI server                       │
│  ├─ Imports: enhance_nationality.py ◄────┼─── NEW!
│  └─ Calls: enhance_nationality_with_ai() │
│                                          │
│  enhance_nationality.py                  │
│  ├─ infer_nationality_from_cv_data()     │
│  ├─ _detect_education_country()          │
│  ├─ _detect_work_countries()             │
│  ├─ _detect_language_indicators()        │
│  ├─ _detect_passport_country()           │
│  └─ enhance_nationality_with_ai()        │
│     └─ Uses OpenAI as fallback           │
│                                          │
│  extract_cv.py                           │
│  └─ Enhanced prompt with rules           │
│     └─ Better initial extraction         │
│                                          │
│  split_and_categorize.py                 │
│  └─ Document categorization              │
│                                          │
└──────────────────────────────────────────┘
```

## Processing Timeline

```
TIME  ACTION                          STATUS
────  ──────────────────────────────  ─────────────
0ms   Receive CV file                 ✓ Input
      │
50ms  Extract text from PDF           ✓ Fast
      │
150ms Call OpenAI (GPT-4o-mini)       ✓ API call
      │
550ms Parse and post-process          ✓ Quick
      │
560ms Call enhance_nationality_with_ai:
      ├─ Check explicit              ✓ Instant
      ├─ Rule-based check            ✓ Fast
      │  ├─ Education analysis       ✓ <5ms
      │  ├─ Work analysis            ✓ <5ms
      │  └─ Language check           ✓ <5ms
      │
580ms Return result (confidence 0.80) ✓ Success
      │
581ms Total parsing time              ✓ Complete

Note: Only uses OpenAI again if confidence < 0.70
(adds ~400ms for AI fallback, but rare for clear cases like Rizwan)
```

This architecture ensures:
- **Fast processing** for clear cases (rule-based detection is instant)
- **Accurate inference** using education as primary indicator
- **Graceful fallback** to AI for edge cases
- **Transparent reasoning** via `nationality_inferred_from` field
- **Confidence scores** for downstream quality control
