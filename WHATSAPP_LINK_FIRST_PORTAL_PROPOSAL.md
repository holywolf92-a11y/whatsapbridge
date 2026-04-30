# Falisha Link-First Intake Proposal

Date: 2026-04-10

## Goal

Replace most of the long WhatsApp data-collection flow with beautiful web intake forms for:

1. Candidate / Job Seeker
2. Employer
3. Partner / Agent

The user would still enter from WhatsApp, but instead of answering many chat questions, the bot would send a smart link to the correct form.

After successful submission:

1. Candidate receives profile link
2. Employer receives access outcome or next-step message
3. Partner / Agent receives credentials for login
4. Social media links are sent
5. AI should understand who the user is and answer according to their identity and submitted data

---

## Executive Recommendation

This is a better product direction than a heavy WhatsApp-only form flow.

Recommended direction:

1. Keep WhatsApp as the entry channel and lightweight conversational guide
2. Move primary intake to responsive, branded glass-morphism web forms
3. Reuse existing candidate onboarding and partner portal infrastructure where possible
4. Add a new employer intake portal flow instead of forcing employer collection fully in WhatsApp
5. Keep WhatsApp for reminders, support, and status follow-up
6. Add identity-aware AI after submission so replies are based on role, current step, and known data

This gives Falisha a more premium and enterprise-quality impression, reduces drop-off, improves validation, and makes the system easier to extend.

---

## What We Already Have

### Frontend

Existing portal/UI assets confirmed:

1. Candidate onboarding page exists
2. Candidate portal dashboard exists
3. Partner portal dashboard exists
4. Review page exists and already contains social media links
5. Auth flow already supports candidate and partner portal routing
6. Candidate onboarding styles already exist and can be reused as design foundation

Relevant confirmed files:

1. [recruitment-portal-frontend/src/App.tsx](recruitment-portal-frontend/src/App.tsx#L655)
2. [recruitment-portal-frontend/src/App.tsx](recruitment-portal-frontend/src/App.tsx#L669)
3. [recruitment-portal-frontend/src/App.tsx](recruitment-portal-frontend/src/App.tsx#L932)
4. [recruitment-portal-frontend/src/components/CandidateOnboardingPage.tsx](recruitment-portal-frontend/src/components/CandidateOnboardingPage.tsx#L1)

Important current frontend fact:

There is no confirmed employer portal/dashboard component equivalent to candidate or partner portal. Employer management exists in admin, but not as a client self-service portal.

### Backend

Existing backend infrastructure confirmed:

1. Candidate onboarding token route exists
2. Candidate portal profile bootstrap and linking exist
3. Partner application to user linking exists
4. Partner portal profile retrieval exists
5. WhatsApp bot state machine exists
6. WhatsApp AI fallback exists

Relevant confirmed files:

1. [recruitment-portal-backend/src/routes/onboarding.ts](recruitment-portal-backend/src/routes/onboarding.ts#L1)
2. [recruitment-portal-backend/src/routes/auth.ts](recruitment-portal-backend/src/routes/auth.ts#L58)
3. [recruitment-portal-backend/src/services/userService.ts](recruitment-portal-backend/src/services/userService.ts#L389)
4. [recruitment-portal-backend/src/services/whatsappBotService.ts](recruitment-portal-backend/src/services/whatsappBotService.ts#L1311)
5. [recruitment-portal-backend/src/services/whatsappAIService.ts](recruitment-portal-backend/src/services/whatsappAIService.ts#L14)

### Existing Role Support

Backend app roles currently confirmed:

1. `admin`
2. `worker`
3. `candidate`
4. `partner`

Confirmed in:

1. [recruitment-portal-backend/src/services/userService.ts](recruitment-portal-backend/src/services/userService.ts#L4)

Important current backend fact:

There is no confirmed `employer` app role in the same portal model as candidate and partner.

---

## What We Do Not Have Yet

### Missing for Candidate Link-First Flow

Mostly available already, but needs refinement:

1. A dedicated public candidate intake landing page optimized for first-time submission
2. Stronger branded premium form UI instead of current functional onboarding tone
3. A clean submission-success flow that clearly separates initial form completion from later full-profile editing
4. AI identity context tied to the candidate record and flow state

### Missing for Employer Link-First Flow

Major gaps:

1. No employer portal/dashboard component confirmed in frontend
2. No employer auth role confirmed in backend app-role model
3. No employer self-service login flow equivalent to candidate/partner
4. No employer credential handoff pattern like partner currently has

### Missing for Partner / Agent Link-First Flow

Mostly available, but still needs a dedicated public intake form:

1. Public premium partner intake form does not exist yet
2. Current partner collection is still WhatsApp-first
3. Credential delivery exists in WhatsApp flow, but not yet via web form submission completion flow

### Missing for AI Personalization

Current WhatsApp AI is generic.

Current limitations in [recruitment-portal-backend/src/services/whatsappAIService.ts](recruitment-portal-backend/src/services/whatsappAIService.ts#L14):

1. No candidate identity lookup
2. No employer identity lookup
3. No partner identity lookup
4. No awareness of portal role
5. No awareness of submitted form data
6. No awareness of incomplete vs completed state
7. No tailored prompt based on user history, candidate profile, partner application, or employer lead

---

## Why Link-First Is Better

### Product Benefits

1. Feels more premium and more enterprise-ready
2. Better validation than free-text WhatsApp parsing
3. Lower user drop-off for long forms
4. Better mobile UX for structured data entry
5. Easier file uploads and progress feedback
6. Easier later expansion for analytics, abandoned-intake recovery, and CRM-style follow-up

### Brand Benefits

1. A polished form immediately makes Falisha look larger and more credible
2. Good design creates trust before users hand over personal or company data
3. Glass-morphism, high-end typography, and consistent brand framing can make the business feel like a premium overseas recruitment platform instead of just a WhatsApp operator

### Technical Benefits

1. Less parsing ambiguity
2. Less recovery complexity from broken chat flows
3. Easier schema evolution
4. Easier analytics tracking
5. Easier role-aware branching after submit

---

## Proposed New Experience

## 1. WhatsApp Entry

User says `Hi`.

Bot replies with 3 large menu buttons:

1. Job Seeker
2. Employer
3. Become a Partner

Instead of collecting the whole form in chat, each button returns:

1. A short role-specific intro
2. A link to the correct mobile-first form
3. A fallback `Talk to Human` option

### Candidate WhatsApp Entry Example

Message:

`Welcome to Falisha Enterprises.`

`To apply faster, please open our Job Seeker form below.`

`You can complete it on your phone in a few minutes.`

Buttons:

1. Open Form
2. Talk to Human
3. Main Menu

### Employer WhatsApp Entry Example

Message:

`Welcome to Falisha Enterprises.`

`Please open our Employer Request form to share your hiring requirements.`

Buttons:

1. Open Form
2. Talk to Human
3. Main Menu

### Partner WhatsApp Entry Example

Message:

`Welcome to Falisha Enterprises.`

`Please open our Partner registration form to begin onboarding.`

Buttons:

1. Open Form
2. Talk to Human
3. Main Menu

---

## 2. Public Premium Intake Forms

### Design Direction

Required visual direction:

1. Glass-morphism cards
2. Premium enterprise look
3. Strong typography
4. High-end spacing and motion
5. Elegant gradients and subtle depth
6. Fully mobile-first and responsive

### Design Notes

Recommended visual system:

1. Deep navy + mineral blue + warm silver palette
2. Frosted translucent panels on layered background
3. High-contrast CTA buttons
4. Step indicator with premium motion
5. Clean iconography and trust signals
6. Optional recruiter-assurance panel with response times and credibility statements

### Candidate Form Fields

Recommended first version:

1. Full Name
2. Profession
3. Contact Number
4. Email
5. Preferred Country
6. CV Upload

Optional second-pass fields can stay for onboarding/profile completion.

### Employer Form Fields

Recommended:

1. Company Name
2. Contact Person Name
3. Contact Number
4. Email
5. Country
6. Employees Required
7. Job Profession
8. Salary
9. Duty Hours
10. Comments

### Partner / Agent Form Fields

Recommended:

1. Full Name
2. Contact Number
3. Email
4. District
5. CNIC
6. CNIC Picture Upload

---

## 3. After Successful Submit

### Candidate

Recommended behavior:

1. Create or update candidate immediately
2. Generate or reuse onboarding/profile token
3. Show success screen in web form
4. Send WhatsApp confirmation
5. Send candidate profile link in a separate WhatsApp message
6. Send social links in a separate WhatsApp message

Candidate success sequence:

1. Submission success message
2. Profile link message
3. Social media message

### Partner / Agent

Recommended behavior:

1. Save partner application
2. Reuse existing partner account if same email exists
3. Otherwise create auth user with temporary password
4. Show success screen in web form
5. Send credentials in WhatsApp message
6. Send dashboard link
7. Send social media links

### Employer

This is the biggest decision point.

There are 2 options:

#### Option A: No Employer Login Yet

1. Save employer lead only
2. Show thank-you page
3. Send WhatsApp confirmation
4. Send social links
5. No credentials

This is fastest and lowest-risk.

#### Option B: Build Real Employer Portal

1. Add `employer` app role
2. Add employer dashboard frontend
3. Add employer profile and auth linkage backend
4. Create credentials or magic-link flow
5. Give employers a real login experience

This is bigger but much more aligned with your client’s idea.

---

## Recommended Product Decision

I recommend this staged rollout:

### Phase 1

1. Candidate link-first form
2. Partner link-first form
3. Employer link-first lead form without employer portal login yet
4. WhatsApp sends:
   1. candidate profile link
   2. partner credentials
   3. employer confirmation only
   4. social links to all

### Phase 2

1. Build employer portal role and dashboard
2. Convert employer from lead-only into full authenticated client portal

Why this is the right order:

1. Candidate and partner already have the strongest base infrastructure
2. Employer portal is the only major missing product area
3. This keeps delivery realistic and lowers regression risk

---

## AI Personalization Proposal

Your requirement is correct: the AI should know who the person is and respond according to their specific data.

### Current State

Current WhatsApp AI is generic.

### Proposed Smart AI Model

For every WhatsApp message after identification, the AI context should include:

1. Role:
   1. candidate
   2. employer
   3. partner
   4. unknown
2. Known identity:
   1. phone number
   2. email
   3. name
3. Linked records:
   1. candidate record
   2. employer lead
   3. partner application
   4. auth user if any
4. Current state:
   1. incomplete form
   2. submitted form
   3. portal created
   4. awaiting review
5. Recent actions:
   1. uploaded CV
   2. received credentials
   3. received onboarding link
   4. asked question about status

### Example AI Behaviors

#### Candidate Example

If candidate says:

`I already submitted my form, how do I edit my profile?`

AI should answer based on actual candidate state:

1. If profile token exists: point to profile link
2. If token missing but candidate linked: generate/send link or guide accordingly
3. If submission incomplete: ask them to complete pending step

#### Partner Example

If partner says:

`I forgot my password`

AI should not answer generically. It should know:

1. whether partner account exists
2. whether credentials were already sent
3. whether there is a login path available

#### Employer Example

If employer says:

`I need 15 welders urgently`

AI should know they are an employer lead and answer in employer context, not candidate context.

### AI Architecture Recommendation

Before AI reply generation, add a resolver layer:

1. identify phone number
2. detect active role or strongest matching entity
3. hydrate related records
4. build structured AI context
5. inject role-specific system prompt and live user context

This should sit before the current generic WhatsApp AI response generation.

---

## What We Need To Build

### Frontend Build Scope

#### Candidate

1. New public candidate intake landing page or premium variant of onboarding-style form
2. Responsive upload flow
3. Premium success screen

#### Partner

1. New public partner intake form
2. Success screen showing review state

#### Employer

1. New public employer intake form
2. Success screen
3. Optional later employer dashboard

#### Shared UI System

1. Shared glass-morphism form shell
2. Shared form sections
3. Shared trust/brand panel
4. Shared success-state components

### Backend Build Scope

1. Public form submit endpoints for candidate / employer / partner
2. Candidate token generation and link delivery after submit
3. Partner account create/reuse and credential delivery after submit
4. Employer lead save and later optional employer auth model
5. AI identity resolution service
6. WhatsApp smart response layer that uses resolved identity

---

## Risks and Tradeoffs

### If We Keep Everything in WhatsApp

Problems:

1. Harder to validate
2. Harder to look premium
3. Higher break rate in long flows
4. More complex reminder logic
5. Worse file-upload UX

### If We Move to Link-First

Problems:

1. Need to build public forms properly
2. Need to design a stronger mobile UX
3. Need to decide employer auth strategy carefully
4. Need secure anti-spam handling on public endpoints

### Net Assessment

Link-first is still the stronger long-term direction.

---

## Recommended Final Architecture

### Best Business-Fit Version

1. WhatsApp remains entry + support + reminders
2. Candidate, Employer, Partner each get dedicated premium public intake link
3. Candidate gets profile link after successful submit
4. Partner gets credentials after successful submit
5. Employer gets thank-you + follow-up unless and until employer portal is built
6. Social links always go as separate message after success
7. AI becomes identity-aware and role-aware

---

## Direct Answers To The Client Idea

### “Why don’t we just give the user a link?”

Answer:

Yes, this is a stronger direction.

### “Can candidate, employer, and partner all use beautiful forms?”

Answer:

Yes, but candidate and partner can be delivered faster because their downstream portal model already exists. Employer needs a product decision because a full employer portal does not currently exist.

### “Can candidate get profile link and partner get credentials?”

Answer:

Yes. Candidate is already closest to this. Partner already has most of the credential creation path. Employer credential delivery should only be promised if we build an employer auth role and portal.

### “Can AI be smarter and know who the person is?”

Answer:

Yes, but that is not the current state. We need an identity-resolution layer before AI response generation.

---

## My Recommendation For Discussion

I recommend we agree on this before writing code:

1. Candidate: link-first form plus profile link after success
2. Partner: link-first form plus credentials after success
3. Employer: choose between lead-only flow or real portal build
4. AI phase: do identity-aware WhatsApp AI after form architecture is defined

---

## Decision Questions

Please decide these 4 product questions before implementation:

1. Employer flow:
   Do you want `lead-only` first, or a real `employer portal` now?
2. Candidate success:
   Should the profile link be shown on the web success screen, sent on WhatsApp, or both?
3. Partner success:
   Should temporary credentials be shown only on WhatsApp, or also on the web success screen?
4. AI scope:
   Do you want phase 1 to ship with form replacement only, or should identity-aware AI be included in the same release?

---

## Suggested Next Build Order

1. Design shared public intake shell
2. Build candidate public form first
3. Build partner public form second
4. Build employer public form third
5. Wire WhatsApp menu to role-specific links
6. Add candidate profile-link send after submit
7. Add partner credential send after submit
8. Add social-link send after submit
9. Add identity-aware AI resolver
