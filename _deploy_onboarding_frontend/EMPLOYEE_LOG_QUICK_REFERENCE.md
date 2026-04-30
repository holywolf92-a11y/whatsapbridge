# 🎯 Employee Task Log - Quick Reference

## 📌 What Is This?

An **accountability system** where employees log daily work performed on candidates. It's:
- ✅ NOT a casual chat or notes app
- ✅ Structured & candidate-linked
- ✅ Audit trail for accountability
- ✅ Manager visibility tool

---

## ⚡ Quick Start

### For Employees:
1. Click **"Employees"** in sidebar
2. Click **"➕ Add Daily Log"**
3. Select: Candidate → Task Type → Write what you did → Time → Submit

**It's that simple!**

### For Managers:
1. Click **"Employees"** → **"Team Logs"** tab
2. Set date range & filters
3. View team activity or export as CSV

---

## 📋 Available Task Types

- 📄 CV screening
- 📞 Candidate call
- 📎 Document follow-up
- 🛂 Passport verification
- 🏥 Medical coordination
- 🎯 Employer submission
- 📅 Interview scheduling
- ✈️ Visa documentation
- 🔧 Other

---

## 🔒 Important Rules

| Rule | Details |
|------|---------|
| **Create Logs** | Only today's logs |
| **Edit Logs** | Only today, same-day only |
| **Delete Logs** | Admins only (audit trail preserved) |
| **View Logs** | Your own / Team (if manager) / All (if admin) |

---

## 📊 What Gets Tracked?

Each log records:
- **Who** (Employee name)
- **What** (Task type)
- **When** (Date logged)
- **Where** (Which candidate)
- **Why** (Description)
- **How Long** (Time spent in minutes)

---

## 🎯 Best Practices

### DO ✅
- Be specific: "Reviewed CV & contacted candidate for screening call"
- Log at end of day (not hours later)
- Use exact time spent
- One log per candidate activity

### DON'T ❌
- Don't write vague: "Worked on stuff"
- Don't log multiple activities in one entry
- Don't edit past logs (not allowed)
- Don't treat it like a note-taking app

---

## 🔍 For Candidate Profiles

When viewing any candidate's profile:
- Scroll to **"Employee Activity Log"** section
- See complete history of work done
- Organized by date (newest first)
- Shows: Employee, Task, Description, Time

---

## 📈 Manager Dashboard

**Team Logs Tab Shows:**
- Total logs created
- Total time spent
- Flagged logs requiring review
- Filter by: Date, Employee, Candidate, Task Type
- Export as CSV for reporting

---

## ❓ FAQ

**Q: Can I add photos/attachments?**
A: Not in this version. Phase 2 might include this.

**Q: Can clients see my logs?**
A: No. This is internal only. (Phase 2 may allow selective visibility)

**Q: What if I log wrong candidate?**
A: Can't edit past logs - ask admin to delete & recreate.

**Q: Can I bulk log multiple tasks?**
A: Not yet. Log each task separately for accuracy.

**Q: Do I have to log everything?**
A: Yes, if it involves a candidate directly. Internal meetings skip.

---

## 📍 Navigation

```
Sidebar → Employees
         ├─ My Daily Log (Employee view)
         │  └─ Stats, Recent activity, Add Log button
         └─ Team Logs (Manager/Admin only)
            └─ Filters, Summary, Export
```

---

## 🚀 Pro Tips

1. **Quick Entry**: Entire log takes <30 seconds
2. **Search Candidates**: Start typing name in dropdown
3. **Today Only**: Log date auto-sets to today
4. **Export Reports**: Download CSV for presentations
5. **Candidate View**: Check activity log inside candidate profile

---

## 🔧 Admin Helpers

### Create New Task Type:
```bash
POST /api/employee-logs/task-types
{
  "name": "New Task Name",
  "description": "Description"
}
```

### View All Task Types:
```bash
GET /api/employee-logs/task-types
```

### Export Team Logs:
Use "Export CSV" button in Team Logs view

---

## 🎯 Key Numbers

- **Daily Log Time**: <30 seconds
- **Fields Required**: Candidate, Task Type, Description
- **Edit Window**: Same day only
- **Default Task Types**: 9 predefined
- **Reviewable After**: 24 hours
- **Retention**: Indefinite (audit trail)

---

## 💡 Why This Matters

For **Accountability**:
- Clear record of who did what
- Resolves disputes with data
- Improves trust

For **Management**:
- See team productivity
- Identify bottlenecks
- Plan better

For **Clients**:
- Transparent candidate tracking (Phase 2)
- Progress visibility
- Professional accountability

---

**Remember:** Logs = Accountability. Be honest, be specific, be thorough. ✅
