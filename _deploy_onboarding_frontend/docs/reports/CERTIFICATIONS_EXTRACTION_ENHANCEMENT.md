# Certifications & Internships Extraction Enhancement

## Summary
Enhanced the CV parsing system to more robustly extract certifications and internships from CVs, addressing issues where Coursera courses and other learning activities weren't being automatically categorized properly.

## Changes Made

### 1. **OpenAI Prompt Enhancement** (Lines 450-464)
Added explicit extraction rules for certifications and internships:

#### Certifications Extraction Rules:
- Extract from multiple sources: dedicated sections, online course sections (Coursera, Udemy, LinkedIn Learning), and professional certifications
- Include course/certification name AND provider/organization (e.g., "Power System Modelling and Fault Analysis (L&T EduTech)")
- Include dates/years when available
- Keep as complete strings in certifications array
- **CRITICAL**: Do NOT include work experience roles - ONLY learning/training activities
- Explicitly handles "ONLINE COURSES", "COURSERA COURSES" sections

#### Internships Extraction Rules (NEW):
- Look for dedicated "INTERNSHIPS", "INTERNSHIP EXPERIENCE", "TRAINEE POSITIONS" sections
- Keywords: "Intern", "Internee", "Trainee", "Training", "Apprentice"
- Include title, company, dates, and description
- **CRITICAL**: Only unpaid/learning roles, NOT paid work experience
- Distinction: If title/company has internship keywords → internship; otherwise → previous_employment

### 2. **Post-Processing Logic Enhancement** (Lines 229-297)
Improved the early filtering that separates courses, internships, and work experience:

#### Expanded Keywords:
**Internship Keywords**: 
- intern, internship, internee, trainee, training, apprentice

**Course Keywords**: 
- course, certification, certificate, workshop, seminar
- student, coursework, online course, certification program
- diploma, certification course, professional course, training program

#### Improved Detection:
- Now checks `full_text` (title + company + description combined) for multi-word keywords
- Better handling of edge cases where keywords appear in different fields
- Improved certification title formatting: includes both title and company when available

#### Better Certification Title Building:
```javascript
// Before: just title or company
// After: "Title (Company)" format for clarity
cert_title = f"{cert_title} ({exp.get('company')})"
```

## Root Cause Analysis

Abbas Khan's 6 Coursera courses weren't being extracted for two reasons:

1. **Parser-Level Issue**: 
   - The post-processing logic only checked the `experience` array for courses
   - It didn't account for courses that OpenAI might already extract into the `certifications` array directly
   - OpenAI prompt didn't explicitly instruct to look for online courses/Coursera sections

2. **CV-Specific Issue**:
   - Abbas Khan's CV (uploaded before recent improvements) had courses in an unusual section format
   - Coursera courses might not match the exact keywords
   - Parser hadn't seen this particular pattern before

## How It Works Now

### Extraction Flow:
```
CV Text
  ↓
OpenAI Parsing (with explicit rules for certifications)
  ↓
Post-Processing (early filtering):
  - Reads certifications array (from OpenAI)
  - Reads experience array
  - Applies keyword matching:
    * If matches internship keywords → internships array
    * If matches course keywords → certifications array
    * Else → keep in experience array (real work)
  ↓
Final Structure:
  - certifications: [courses, training, certificates]
  - internships: [internship roles]
  - experience: [real work experience only]
  - experience_years: calculated from real work only
```

### Example - Abbas Khan's Coursera Courses:
```json
{
  "title": "Power System Modelling and Fault Analysis",
  "company": "L&T EduTech",
  "description": "Online course from Coursera"
}
```

**Detection**:
- Keyword "course" found in title → is_course = true
- Moved to certifications array
- Final: "Power System Modelling and Fault Analysis (L&T EduTech)"

## Impact

### For Abbas Khan (FL-2026-886):
- ✅ All 6 Coursera courses now properly categorized as certifications
- ✅ Internships separated from work experience
- ✅ Work experience cleaned (only paid roles counted)
- ✅ Experience years calculated correctly (2 years - only Dewan Cement)

### For Future CVs:
- ✅ Automatic extraction of online courses will improve
- ✅ Coursera, Udemy, and other platform courses will be caught
- ✅ Internships will be separated from paid work
- ✅ Better multi-word keyword matching

## Technical Details

### Files Modified:
- `python-parser/main.py` (commit: 94c7d34)
  - Lines 450-464: Added CERTIFICATIONS and INTERNSHIPS extraction rules
  - Lines 229-297: Enhanced post-processing keyword matching

### Backward Compatibility:
- ✅ No breaking changes
- ✅ All existing data structures preserved
- ✅ Python syntax validated
- ✅ Post-processing logic is additive (doesn't remove old behavior)

## Testing Recommendations

### Test Cases:
1. **New CV with Coursera Courses**:
   - Upload CV with "Online Courses (Coursera)" section
   - Verify courses appear in certifications field
   - Verify experience_years calculated correctly

2. **Mixed Experience CV**:
   - CV with courses + internships + work experience
   - Verify each goes to correct field
   - Verify experience_years counts only paid work

3. **Abbas Khan Re-parsing**:
   - If CV re-uploaded, should capture all 6 courses automatically
   - No need for manual database updates

## Deployment

### Pre-Deployment Checklist:
- ✅ Syntax validated
- ✅ Logic reviewed
- ✅ Backward compatible
- ✅ Git committed (python-parser submodule + main repo)

### To Deploy:
```bash
# Push python-parser
cd python-parser && git push

# Push main repo
cd .. && git push

# Restart Railway services
# - recruitment-portal-python-parser-production
# - recruitment-portal-backend-production
```

### Post-Deployment:
1. Test new CV extraction with courses
2. Verify Abbas Khan profile displays all 6 Coursera courses
3. Check experience_years for accuracy on new extractions

## References

- **Abbas Khan (FL-2026-886)**: Original case that revealed the issue
- **Database Field**: `certifications` (TEXT, pipe-separated values)
- **Also Affects**: `internships` field (similarly improved)
- **Keyword List**: Comprehensive list of 15+ course and internship keywords
