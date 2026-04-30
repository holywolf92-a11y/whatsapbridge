# CANDIDATES_UI_GAP_LIST.md

## Gap Analysis: Current Implementation vs. Figma Design

**Status**: Awaiting Figma Design Reference  
**Date**: January 13, 2026

### IMPORTANT: Figma Link Required

To proceed with pixel-perfect alignment, please provide:
- **Figma File Link** to the Candidates module screens
- **Specific Frame Names** (e.g., "Candidates List", "Candidate Detail", "Documents Checklist")

### Preliminary Gaps Identified from Code Review

#### 1. **List View / Cards Layout**
- [ ] Card grid layout unclear - currently using horizontal cards with flex
- [ ] Need clarification: Grid 2-3 cols or single column list?
- [ ] Card spacing/padding alignment with Figma
- [ ] Hover states: Does Figma show elevation, background change, or scale?
- [ ] Avatar size inconsistency (currently 16h × 16w in some places)
- [ ] Status badge positioning and styling
- [ ] Action buttons placement (currently top-right, verify with Figma)

#### 2. **Search & Filter Bar**
- [ ] Search input styling: size, border, icon placement
- [ ] Filter button visibility and styling
- [ ] Filter options layout (dropdown, pills, sidebar?)
- [ ] Search placeholder text
- [ ] Button spacing in header area

#### 3. **Table vs. Card Toggle** (if applicable)
- [ ] Check if Figma includes table view toggle
- [ ] Table column headers styling
- [ ] Row height consistency
- [ ] Striped rows or border separators?

#### 4. **Candidate Row/Card Details**
- [ ] Name styling: font size, weight, color
- [ ] Secondary info layout (position, location, status)
- [ ] Icon styling and alignment (Lucide size: 16px, 20px, 24px?)
- [ ] Text color hierarchy: primary (gray-900) vs. secondary (gray-600) vs. muted (gray-500)
- [ ] Badge styling: colors, padding, border radius
- [ ] Extraction source badge: "From CV" vs. "Manual" styling

#### 5. **Action Buttons per Row**
- [ ] Button text or icons only? (currently icons: eye, edit, download, etc.)
- [ ] Button sizes: sm, default, or custom?
- [ ] Spacing between action buttons (currently gap-2)
- [ ] Hover/focus states visible?
- [ ] Dropdown menu for more actions? (currently not visible)

#### 6. **Empty State**
- [ ] Icon size and styling (currently 32px)
- [ ] Heading text: font size, color
- [ ] Description text: color, font size
- [ ] Button visibility (CTA to add candidate?)
- [ ] Background color (currently white card on gray-50)

#### 7. **Loading State**
- [ ] Skeleton loaders for cards/rows? (currently just spinner)
- [ ] Skeleton height/width matching real cards
- [ ] Animation smoothness

#### 8. **Candidate Detail Modal/Page**
- [ ] Modal size: max-w-4xl or different?
- [ ] Header layout: avatar + name + close button alignment
- [ ] Header background: white or with gradient/color?
- [ ] Spacing between sections (currently p-6, verify)

#### 9. **Tabs Styling**
- [ ] Active/inactive tab styling: underline thickness, color (currently blue-600)
- [ ] Tab padding and sizing
- [ ] Badge on "Documents" tab: styling, position
- [ ] Tab hover states

#### 10. **Contact Information Section**
- [ ] Icon + label + input layout alignment
- [ ] Input field styling when read-only vs. editable
- [ ] Label text styling: size, color (currently "text-xs font-semibold text-gray-500 uppercase")
- [ ] 2-column grid on md: is this correct in Figma?

#### 11. **Professional Details Section**
- [ ] Section header styling
- [ ] Grid columns: 1 or 2? Responsive breakpoint?
- [ ] Input field consistency across sections
- [ ] Edit/Save button position and styling

#### 12. **Documents Section / Checklist**
- [ ] Document list styling: card or table rows?
- [ ] Status badges: colors for "verified", "pending", "expired"
- [ ] File icon styling and sizing
- [ ] Action buttons layout (download, view, delete)
- [ ] Document upload button: styling, icon, placement
- [ ] **Checklist pattern** for required docs (Passport, CNIC, Degree, Medical, Visa):
  - [ ] Checkbox styling (filled vs. empty)
  - [ ] Status indicator colors (green ✓, yellow ⏳, red ✗)
  - [ ] Due/expiry date display
  - [ ] Received date display
  - [ ] Required vs. optional doc indication

#### 13. **Timeline / History Section** (if present)
- [ ] Timeline entry styling: card, list, or vertical line?
- [ ] Avatar sizes in timeline
- [ ] Timestamp formatting and positioning
- [ ] Event type icons and colors
- [ ] Expand/collapse states

#### 14. **Notes / Tags Section** (if present)
- [ ] Tag styling: colors, sizes, border
- [ ] Add tag button styling
- [ ] Note input field styling
- [ ] Character count display (if needed)

#### 15. **Extraction Modal** (if in Figma)
- [ ] Modal header styling
- [ ] Extracted field layout: form grid or single column?
- [ ] Confidence score display: percentage, bar, icon?
- [ ] Approve/Edit buttons styling
- [ ] Field validation states (errors, warnings, success)

#### 16. **Color & Typography Inconsistencies**
- [ ] Primary text: gray-900 vs. other shades?
- [ ] Secondary text: gray-600 or gray-700?
- [ ] Muted text: gray-500 or gray-400?
- [ ] Headings: font-size and font-weight (h3, h4 consistency)
- [ ] Status colors: green (verified), yellow (pending), red (expired), blue (applied)

#### 17. **Spacing & Padding**
- [ ] Modal padding: p-6 correct?
- [ ] Card padding: p-6 correct?
- [ ] Gap between grid items: gap-4 or gap-6?
- [ ] Section spacing: space-y-6 correct?
- [ ] Input field padding: p-1, p-2, or p-3?

#### 18. **Border Radius**
- [ ] Modal: rounded-lg (0.5rem) or rounded-xl (0.75rem)?
- [ ] Cards: rounded-lg?
- [ ] Badges: rounded-full?
- [ ] Buttons: rounded-lg or rounded-md?
- [ ] Input fields: rounded-lg?

#### 19. **Responsive Design**
- [ ] Mobile layout: single column or adjusted grid?
- [ ] Touch target sizes (buttons, cards): minimum 44px?
- [ ] Modal on mobile: full screen or bottom sheet?
- [ ] Overflow behavior: horizontal scroll or stack?

#### 20. **Icons & Visual Elements**
- [ ] Lucide icon sizes: consistently 16px (w-4 h-4), 20px (w-5 h-5), 24px (w-6 h-6)?
- [ ] Icon colors: gray-400, gray-600, or status-specific?
- [ ] Status icons: CheckCircle (green), AlertCircle (yellow), XCircle (red)?
- [ ] Avatar styling: size, background color, text styling

#### 21. **Buttons & CTAs**
- [ ] Primary button: bg-blue-600 text-white?
- [ ] Secondary button: border border-gray-300 bg-white?
- [ ] Danger button: bg-red-600?
- [ ] Button padding: px-4 py-2?
- [ ] Button border radius: rounded-lg?

#### 22. **Form Fields & Inputs**
- [ ] Readonly input styling: bg-gray-100 border-transparent?
- [ ] Editable input styling: border border-gray-300?
- [ ] Focus states: ring-2 ring-blue-500?
- [ ] Placeholder text styling
- [ ] Input height consistency

#### 23. **Scrolling & Overflow**
- [ ] Modal content overflow: max-h-[90vh] overflow-y-auto?
- [ ] Sticky header in modal?
- [ ] Sticky tabs?
- [ ] Smooth scroll behavior?

#### 24. **Data Display Patterns**
- [ ] Empty field fallback: "N/A" or blank?
- [ ] Loading state in fields: skeleton or spinner?
- [ ] Field validation messages: inline or tooltip?
- [ ] Success messages after save?

#### 25. **Accessibility & Interactive States**
- [ ] Focus rings visible on keyboard navigation?
- [ ] Hover states distinct and visible?
- [ ] Disabled button styling
- [ ] Aria labels for icon-only buttons
- [ ] Tab order logical?

---

## Next Steps

1. **Provide Figma Link** → I will do visual comparison
2. **Flag unclear areas** in Figma design
3. **Create pixel-perfect components** matching Figma exactly
4. **Screenshot before/after** for verification

## Files to Update (Pending Figma Review)

- `src/components/CandidateManagement.tsx`
- `src/components/CandidateBrowser.tsx`
- `src/components/CandidateBrowserEnhanced.tsx`
- `src/components/CandidateDetailsModal.tsx`
- `src/components/DocumentManagement.tsx` (document section patterns)
- Custom styles/components as needed

---

**⏸ Waiting for Figma design reference to proceed with implementation.**
