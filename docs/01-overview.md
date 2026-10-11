# 1. Project overview

## Purpose

Early Risk Check is a university project for DIT2108 (Computing Project and Development Approaches). It is a web application that collects basic health and lifestyle answers and displays rule-based risk levels for type 2 diabetes, heart disease, and high blood pressure.

The result is a screening aid, not a diagnosis or medical advice. The sign-in screen says this explicitly.

## Problem statement

People may not recognise risk factors associated with long-term conditions. The application provides a short, structured questionnaire and summarises selected risk factors and possible actions. The code does not claim to detect disease or replace a clinician.

## Objectives

- Let a user create an account and sign in.
- Collect the health and lifestyle fields used by the scoring rules.
- Calculate three risk levels and show contributing factors and general tips.
- Let a patient see their own previous assessments.
- Let clinicians and admins review recent assessments.
- Let admins manage account roles.

## Users

| User | Implemented capabilities |
|---|---|
| Patient | Register, sign in, submit assessments, view their own history and print a results view. |
| Clinician | Patient capabilities plus view the recent-assessment review list. |
| Admin | Clinician capabilities plus list users and change another user's role. An admin cannot change their own role in the real API. |

All accounts created through the real registration endpoint start with the `patient` role. Promoting the first admin is an out-of-band SQL operation described in [setup and deployment](07-setup-and-deployment.md).

## Features

- React single-page frontend with login/registration and pages for assessment, history, review, and user management.
- Three-step form covering personal measurements, habits, and health history.
- Server-side Zod validation and server-side scoring when the real API is selected.
- Levels named lower, moderate, and higher, with factor labels, a three-zone ruler, BMI, tips, and a checkup prompt.
- PostgreSQL persistence through Drizzle ORM.
- JWT session in an httpOnly cookie on the real API.
- In-browser mock API backed by `localStorage` for demonstration without the server.
- A backend smoke-test script and print stylesheet for the report view.

## Scope

The implemented assessment covers age, sex, height, weight, waist circumference, optional systolic blood pressure, activity, fruit and vegetable frequency, smoking, family history, previous high blood sugar, and blood-pressure medicine. The exact rules are in [risk scoring](05-risk-scoring.md).

## Not included

- Cancer risk, diagnosis, clinical decision support, or validated disease prediction: **not implemented**.
- Email verification, password reset, multi-factor authentication, or a consent screen: **not implemented**.
- PDF generation, multilingual UI, audit trail, or appointment booking: **not implemented**.
- A machine-learning model or clinical validation: **not implemented**.
- Production deployment configuration for a particular provider: **not implemented** in the repository.

Further limitations are listed in [limitations and future work](10-limitations-and-future-work.md).
