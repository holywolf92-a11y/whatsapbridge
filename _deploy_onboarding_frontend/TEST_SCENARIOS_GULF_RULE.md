# Test Scenarios: Gulf Countries Expat Rule

This document provides test cases to verify that the Gulf countries rule is working correctly.

## Test Case 1: Pakistani Educated, Working in Gulf

**Scenario**: Candidate studied in Pakistan, now working in UAE

**Input:**
```json
{
  "name": "Ali Rahman",
  "education": "BS Computer Science from FAST-NUCES, Islamabad (2018)",
  "work_experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Google Dubai",
      "location": "Dubai, UAE",
      "start_date": "2019",
      "end_date": "present"
    }
  ],
  "languages": ["Urdu", "English", "Arabic"]
}
```

**Expected Output:**
```json
{
  "nationality": "Pakistan",
  "nationality_inferred_from": "education (Pakistan)",
  "confidence": 0.80,
  "reasoning": "FAST-NUCES is a Pakistani university in Islamabad"
}
```

**Why This Works**: Education (Pakistan university) takes priority over work location (Gulf). Person is likely a Pakistani expat working in UAE.

---

## Test Case 2: Only Gulf Work Experience, No Education

**Scenario**: Candidate only has work in Saudi Arabia, no education data provided

**Input:**
```json
{
  "name": "Mohammad Ahmed",
  "education": null,
  "work_experience": [
    {
      "title": "Project Manager",
      "company": "Saudi Aramco",
      "location": "Riyadh, Saudi Arabia",
      "start_date": "2015",
      "end_date": "present"
    }
  ],
  "languages": ["English"]
}
```

**Expected Output:**
```json
{
  "nationality": null,
  "nationality_inferred_from": null,
  "confidence": 0.0,
  "reasoning": "Work location is Gulf country (Saudi Arabia). Without education/passport/language confirmation, cannot infer nationality."
}
```

**Why This Works**: The rule explicitly excludes Gulf countries from work-based inference. System returns null instead of falsely assuming "Saudi Arabia" nationality.

---

## Test Case 3: Gulf Work + Urdu Language (No Education)

**Scenario**: Candidate works in UAE but speaks Urdu (strong Pakistani indicator)

**Input:**
```json
{
  "name": "Hassan Khan",
  "education": null,
  "work_experience": [
    {
      "title": "Senior Manager",
      "company": "Emirates NBD",
      "location": "Abu Dhabi, UAE",
      "start_date": "2010",
      "end_date": "present"
    }
  ],
  "languages": ["Urdu", "English", "Hindi"]
}
```

**Expected Output:**
```json
{
  "nationality": "Pakistan",
  "nationality_inferred_from": "language_skills",
  "confidence": 0.70,
  "reasoning": "Native Urdu language is strong Pakistani indicator. Work in Gulf is secondary."
}
```

**Why This Works**: Language detection (Urdu) confirms Pakistani nationality before work location check occurs. Urdu is a native language indicator for Pakistan.

---

## Test Case 4: Explicit Passport Code (Golden Rule)

**Scenario**: Candidate has Pakistani passport code

**Input:**
```json
{
  "name": "Fatima Ali",
  "passport_number": "PA-1234567",
  "education": null,
  "work_experience": [
    {
      "title": "Accountant",
      "company": "ADNOC",
      "location": "Abu Dhabi, UAE",
      "start_date": "2016",
      "end_date": "present"
    }
  ],
  "languages": ["English", "Arabic"]
}
```

**Expected Output:**
```json
{
  "nationality": "Pakistan",
  "nationality_inferred_from": "passport_country_code",
  "confidence": 0.90,
  "reasoning": "Passport code 'PA' indicates Pakistan. Highest confidence."
}
```

**Why This Works**: Passport is explicit identifier. "PA" = Pakistan (0.90 confidence). Gulf work location never checked.

---

## Test Case 5: Non-Gulf Work Location (No Education)

**Scenario**: Candidate works in India, no education data

**Input:**
```json
{
  "name": "Priya Singh",
  "education": null,
  "work_experience": [
    {
      "title": "Software Engineer",
      "company": "TCS",
      "location": "Bangalore, India",
      "start_date": "2018",
      "end_date": "present"
    }
  ],
  "languages": ["English", "Hindi"]
}
```

**Expected Output:**
```json
{
  "nationality": "India",
  "nationality_inferred_from": "primary_work_location (India) AND language_skills",
  "confidence": 0.75,
  "reasoning": "Work in India (non-Gulf country) + Hindi language both support India nationality"
}
```

**Why This Works**: Non-Gulf work locations (India, Pakistan, etc.) CAN be used for inference when education isn't available. Gulf countries are specifically excluded due to high expat populations.

---

## Test Case 6: Pakistan Work + Pakistan Education

**Scenario**: Rizwan Ali's case - fully Pakistani profile

**Input:**
```json
{
  "name": "Rizwan Ali",
  "email": "rizwankaramat989@gmail.com",
  "education": "BS Computer Science from FAST-NUCES, Islamabad",
  "work_experience": [
    {
      "title": "Software Engineer",
      "company": "TCS Pakistan",
      "location": "Islamabad, Pakistan",
      "start_date": "2019",
      "end_date": "2021"
    },
    {
      "title": "Project Manager",
      "company": "DHA Islamabad",
      "location": "Islamabad, Pakistan",
      "start_date": "2021",
      "end_date": "present"
    }
  ],
  "languages": ["Urdu", "English"]
}
```

**Expected Output:**
```json
{
  "nationality": "Pakistan",
  "nationality_inferred_from": "education (Pakistan)",
  "confidence": 0.80,
  "reasoning": "Education at FAST-NUCES (Pakistani university) in Islamabad. Primary indicator."
}
```

**Why This Works**: Education is the most reliable indicator. Even though work experience also supports Pakistan, education is checked first and returns.

---

## Test Case 7: Qatar Work + No Other Data

**Scenario**: Candidate only has Qatar work experience

**Input:**
```json
{
  "name": "Ahmed Al-Dosari",
  "education": null,
  "work_experience": [
    {
      "title": "Director",
      "company": "Qatar Petroleum",
      "location": "Doha, Qatar",
      "start_date": "2012",
      "end_date": "present"
    }
  ],
  "languages": ["English"]
}
```

**Expected Output:**
```json
{
  "nationality": null,
  "nationality_inferred_from": null,
  "confidence": 0.0,
  "reasoning": "Work location is Gulf country (Qatar). Cannot infer nationality without education/passport/language confirmation."
}
```

**Why This Works**: Qatar is in the Gulf exclusion list. Returns null rather than falsely inferring Qatari nationality.

---

## Test Case 8: Kuwait Work + Indian Education

**Scenario**: Indian educated person working in Kuwait

**Input:**
```json
{
  "name": "Rajesh Kumar",
  "education": "BTech from IIT Mumbai, India (2015)",
  "work_experience": [
    {
      "title": "Systems Engineer",
      "company": "MEW (Ministry of Electricity & Water)",
      "location": "Kuwait City, Kuwait",
      "start_date": "2018",
      "end_date": "present"
    }
  ],
  "languages": ["English", "Hindi"]
}
```

**Expected Output:**
```json
{
  "nationality": "India",
  "nationality_inferred_from": "education (India)",
  "confidence": 0.80,
  "reasoning": "Education at IIT Mumbai (Indian university). Primary indicator overrides work location."
}
```

**Why This Works**: IIT is an Indian university. Education priority means Kuwait work location is never evaluated. Correctly identifies as Indian national.

---

## Test Case 9: Bahrain Work + Arabic Only

**Scenario**: Arabic speaker working in Bahrain, no education

**Input:**
```json
{
  "name": "Layla Al-Khalifa",
  "education": null,
  "work_experience": [
    {
      "title": "HR Manager",
      "company": "Ahli United Bank",
      "location": "Manama, Bahrain",
      "start_date": "2015",
      "end_date": "present"
    }
  ],
  "languages": ["Arabic", "English"]
}
```

**Expected Output:**
```json
{
  "nationality": null,
  "nationality_inferred_from": null,
  "confidence": 0.0,
  "reasoning": "Work is in Gulf country (Bahrain). Arabic alone is insufficient for nationality (too many Arabic speakers globally). Requires education/passport confirmation."
}
```

**Why This Works**: While Arabic might suggest Gulf/Arab country, it's not specific enough. Combined with Gulf work location, system rightly returns null. If they have University of Beirut education, would infer Lebanon instead.

---

## Test Case 10: Oman Work + Pakistani Company + No Explicit Data

**Scenario**: Worked at Pakistani company branch in Oman

**Input:**
```json
{
  "name": "Samir Malik",
  "education": null,
  "work_experience": [
    {
      "title": "Operations Manager",
      "company": "PTCL Global (Oman)",
      "location": "Muscat, Oman",
      "start_date": "2017",
      "end_date": "present"
    }
  ],
  "languages": ["Urdu", "English"]
}
```

**Expected Output:**
```json
{
  "nationality": "Pakistan",
  "nationality_inferred_from": "language_skills + company_indicator",
  "confidence": 0.70,
  "reasoning": "Urdu language (strong Pakistani indicator) + PTCL (Pakistani company). Suggests Pakistani national working for Pakistani company branch in Oman."
}
```

**Why This Works**: Language (Urdu) is detected before work location, so Pakistan is confirmed. Work in Oman (Gulf) never becomes the deciding factor.

---

## Test Case 11: Edge Case - False Passport Code

**Scenario**: Someone has "KA" in their name (not a passport), no other data

**Input:**
```json
{
  "name": "Ahmad Khan",
  "passport_number": null,
  "education": null,
  "work_experience": [
    {
      "title": "Engineer",
      "company": "ADNOC",
      "location": "Abu Dhabi, UAE",
      "start_date": "2014",
      "end_date": "present"
    }
  ],
  "languages": ["English"]
}
```

**Expected Output:**
```json
{
  "nationality": null,
  "nationality_inferred_from": null,
  "confidence": 0.0,
  "reasoning": "No valid passport code. Work is Gulf location. Cannot infer without education/language confirmation."
}
```

**Why This Works**: System correctly ignores "Khan" as passport code (pattern matching requires exact format). Gulf work alone returns null.

---

## How to Run These Tests

### Option 1: Manual Testing
```python
from python-parser.enhance_nationality import enhance_nationality_with_ai

cv_data = {
    "name": "Ali Rahman",
    "education": "BS Computer Science from FAST-NUCES, Islamabad (2018)",
    "primary_work_countries": [("UAE", 0.70)],
    "languages": ["Urdu", "English", "Arabic"]
}

result = enhance_nationality_with_ai(cv_data)
print(f"Nationality: {result['nationality']}")
print(f"Source: {result['nationality_inferred_from']}")
print(f"Confidence: {result['nationality_confidence']}")
```

### Option 2: Database Query
```sql
-- Check recent CV parsing results
SELECT 
    id, name, nationality, nationality_inferred_from,
    nationality_confidence,
    attached_data->>'education' as education,
    attached_data->>'previous_employment' as work_experience
FROM candidates 
WHERE attached_data IS NOT NULL 
AND nationality IS NOT NULL
ORDER BY created_at DESC 
LIMIT 20;
```

### Option 3: Re-Parse Specific Candidates
```javascript
// See backend scripts for re-parsing specific candidates
node backend/check-cv-nationality.js --candidate-id <id>
```

---

## Validation Checklist

After implementing the Gulf countries rule, verify:

- [ ] Test Case 1: Pakistani educated in Gulf → Inferred as Pakistan ✅
- [ ] Test Case 2: Only Gulf work → Returns null (not assumed as Gulf national) ✅
- [ ] Test Case 3: Gulf work + Urdu → Inferred as Pakistan from language ✅
- [ ] Test Case 4: Passport code → Highest priority (0.90 confidence) ✅
- [ ] Test Case 5: Non-Gulf work → Can be used for inference ✅
- [ ] Test Case 6: Rizwan Ali example → Inferred as Pakistan (0.80 education) ✅
- [ ] Test Case 7: Qatar only → Returns null (not assumed Qatari) ✅
- [ ] Test Case 8: Indian education in Kuwait → Inferred as India ✅
- [ ] Test Case 9: Bahrain + Arabic → Returns null (insufficient) ✅
- [ ] Test Case 10: Oman + Urdu → Inferred as Pakistan from language ✅
- [ ] Test Case 11: No valid data → Returns null ✅

## Notes

- All test cases assume the OpenAI extraction has already completed successfully
- Confidence scores are approximate ranges (0.60-0.95)
- Confidence threshold for AI fallback: 0.70
- Gulf country exclusion is the CRITICAL feature here
- System will log reasoning for audit trail
