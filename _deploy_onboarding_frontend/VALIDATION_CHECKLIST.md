# Document Categorization - Quick Validation Checklist

**Use this checklist during implementation to ensure nothing is missed**

---

## ✅ Pre-Implementation (Phase 0)

```
[ ] Read CRITICAL_IMPLEMENTATION_NOTES.md completely
[ ] Understand PostgreSQL enum cannot be reordered
[ ] Understand storage folder 1:1 mapping requirement
[ ] Understand certificates = professional certs ONLY
[ ] Prepared multi-document test PDF (4 pages)
```

---

## ✅ Database Migration (Phase 1)

```
[ ] Migration file created: 027_split_certificates_category.sql
[ ] Enum values added AT THE END (not inserted between)
[ ] NOT trying to rename 'certificates' enum
[ ] NOT trying to remove any enum values
[ ] NOT trying to reorder enum values
[ ] Display function updated with new categories
[ ] Tested on local database successfully
[ ] Rollback script prepared (just in case)
```

---

## ✅ Backend Configuration (Phase 2)

```
[ ] documentCategories.ts updated with 3 new constants
[ ] splitUploadService.ts updated with folder mappings
[ ] Folder mapping: degree → educational_documents
[ ] Folder mapping: experience_letter → experience_certificates
[ ] Folder mapping: navttc → navttc_reports
[ ] Folder mapping: police_certificate → police_character_certificate
[ ] candidateDocumentService.ts category maps updated
[ ] cvParserWorker.ts category maps updated
[ ] TypeScript compiles without errors
[ ] No breaking changes in API
```

---

## ✅ Storage Folders (Phase 2.5)

```
[ ] Supabase storage bucket: candidate-documents verified
[ ] Folder created: /educational_documents/
[ ] Folder created: /experience_certificates/
[ ] Folder created: /navttc_reports/
[ ] Folder exists: /police_character_certificate/
[ ] Folder permissions set correctly (read/write)
[ ] Folder paths match enum values exactly
```

---

## ✅ Python Parser (Phase 3)

```
[ ] DOC_CATEGORIES list updated with 3 new categories
[ ] normalize_doc_type() function updated
[ ] Mapping: degree, diploma → educational_documents
[ ] Mapping: experience_letter → experience_certificates
[ ] Mapping: navttc, navtic → navttc_reports
[ ] VISION_PROMPT updated with CLEAR category definitions
[ ] Prompt emphasizes: educational ≠ professional ≠ vocational
[ ] Tested with sample degree certificate
[ ] Tested with sample experience letter
[ ] Tested with sample NAVTTC certificate
[ ] AI confidence scores acceptable (>0.80)
```

---

## ✅ Frontend UI (Phase 4)

```
[ ] DocumentUploadVerification.tsx updated
[ ] Added: educational_documents with GraduationCap icon
[ ] Added: experience_certificates with Briefcase icon
[ ] Added: navttc_reports with Award icon
[ ] Updated: police_character_certificate with Shield icon
[ ] Updated: certificates label to "Professional Certificates"
[ ] CandidateDetailsModal.tsx updated
[ ] Document categories info shows new folders
[ ] Document grouping logic updated
[ ] DocumentManagement.tsx updated
[ ] Filter dropdown has new categories
[ ] Category statistics work correctly
[ ] Icons display correctly
[ ] Colors are distinct and visible
```

---

## ✅ Testing - Individual Categories (Phase 5.1-5.4)

```
Educational Documents:
[ ] Upload degree certificate → classified correctly
[ ] Upload diploma → classified correctly
[ ] Upload transcript → classified correctly
[ ] Stored in /educational_documents/ folder
[ ] UI shows in Educational Documents folder

Experience Certificates:
[ ] Upload experience letter → classified correctly
[ ] Upload employment certificate → classified correctly
[ ] Stored in /experience_certificates/ folder
[ ] UI shows in Experience Certificates folder

NAVTTC Reports:
[ ] Upload NAVTTC certificate → classified correctly
[ ] Stored in /navttc_reports/ folder
[ ] UI shows in NAVTTC Reports folder

Police Certificate:
[ ] Upload police clearance → classified correctly
[ ] Stored in /police_character_certificate/ folder
[ ] UI shows in Police Certificate folder

Professional Certificates:
[ ] Upload AWS cert → classified correctly
[ ] Upload CCNA cert → classified correctly
[ ] Stored in /certificates/ folder (NOT mixed with degrees)
[ ] UI shows in Professional Certificates folder
```

---

## 🧪 MANDATORY MULTI-DOCUMENT TEST (Phase 5.6)

```
[ ] Created test PDF with 4 pages:
    Page 1: Degree certificate
    Page 2: Experience letter
    Page 3: Police clearance
    Page 4: NAVTTC certificate

[ ] Uploaded via split-upload endpoint

[ ] AI split into 4 separate documents (not 1, not 2, not 3)

[ ] Document 1: category = 'educational_documents' ✓
[ ] Document 1: stored in /educational_documents/ folder ✓

[ ] Document 2: category = 'experience_certificates' ✓
[ ] Document 2: stored in /experience_certificates/ folder ✓

[ ] Document 3: category = 'police_character_certificate' ✓
[ ] Document 3: stored in /police_character_certificate/ folder ✓

[ ] Document 4: category = 'navttc_reports' ✓
[ ] Document 4: stored in /navttc_reports/ folder ✓

[ ] UI shows 4 separate folders with 1 doc each
[ ] Candidate details modal shows correct grouping
[ ] Document download works for each category
[ ] Document preview works for each category
```

---

## ✅ Business Rule Validation (Phase 5.7)

```
Certificates Folder - Professional Certs ONLY:
[ ] AWS certification → in /certificates/ folder ✓
[ ] CCNA certification → in /certificates/ folder ✓
[ ] PMP certification → in /certificates/ folder ✓

Certificates Folder - NO Educational Docs:
[ ] Degree certificate → NOT in /certificates/ folder ✓
[ ] Diploma → NOT in /certificates/ folder ✓
[ ] Transcript → NOT in /certificates/ folder ✓

Certificates Folder - NO Experience Letters:
[ ] Experience letter → NOT in /certificates/ folder ✓
[ ] Employment certificate → NOT in /certificates/ folder ✓

Certificates Folder - NO NAVTTC:
[ ] NAVTTC certificate → NOT in /certificates/ folder ✓

Certificates Folder - NO Police Certs:
[ ] Police clearance → NOT in /certificates/ folder ✓
```

---

## ✅ Deployment (Phase 6)

```
[ ] Database migration run on Supabase production
[ ] Backend deployed to production
[ ] Python parser deployed to production
[ ] Frontend deployed to production
[ ] Smoke test passed (upload one document)
[ ] Multi-document test passed in production
[ ] Monitored logs for 1 hour (no errors)
[ ] Checked sample candidates (documents categorized correctly)
```

---

## ✅ Documentation (Phase 6)

```
[ ] Migration guide created
[ ] API documentation updated
[ ] User guide created with examples
[ ] Team trained on new categories
[ ] Support team notified of changes
```

---

## ✅ Final Validation (Before Closing Task)

```
ENUM ORDERING:
[ ] Enum values added at END ✓
[ ] NOT renamed existing values ✓
[ ] NOT removed existing values ✓
[ ] NOT reordered values ✓

STORAGE STRUCTURE:
[ ] All folders exist ✓
[ ] All folders match enum values ✓
[ ] Permissions correct ✓

BUSINESS RULE:
[ ] Certificates = professional certs ONLY ✓
[ ] Educational docs in own folder ✓
[ ] Experience certs in own folder ✓
[ ] NAVTTC in own folder ✓
[ ] Police certs properly routed ✓

MANDATORY TEST:
[ ] Multi-document test PASSED ✓
[ ] 4 documents created ✓
[ ] 4 correct categories ✓
[ ] 4 correct storage folders ✓
[ ] UI grouping correct ✓

REGRESSION:
[ ] Existing categories still work ✓
[ ] CV upload still works ✓
[ ] Passport upload still works ✓
[ ] No broken links ✓
[ ] No console errors ✓
```

---

## 🎯 Task Complete When:

```
✅ ALL checkboxes above are checked
✅ Multi-document test case passes
✅ Business rule enforced (certificates = professional only)
✅ Storage folders match categories (1:1)
✅ No regression in existing functionality
✅ Documentation complete
✅ Team trained

❌ Task is NOT complete if:
- Multi-document test fails
- Degrees going to certificates folder
- Experience letters going to certificates folder
- NAVTTC certs going to certificates folder
- Storage folders don't match enum values
- Any checkbox unchecked above
```

---

**Use this checklist as you implement. Check off each item as you complete it.**

**Print this or keep it open in a separate window.**

---

**Status**: ⏳ Implementation Pending  
**Last Updated**: February 4, 2026
