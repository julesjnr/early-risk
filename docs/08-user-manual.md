# 8. User manual

Early Risk Check gives a simple estimate from the answers you enter. It does not diagnose illness. Talk to a qualified health professional about health concerns.

## Create an account

1. Open the app. The welcome screen has an account form and an example risk ruler.
2. Enter your name, email address, and a password of at least eight characters.
3. Select **Create account**.

On the real server, a new account starts as a patient. The mock demo has preset accounts and stores its own data in your browser.

[Screenshot: welcome and registration page]

## Sign in

1. On the welcome screen, choose **I already have an account**.
2. Enter your email and password.
3. Choose **Sign in**.

If sign-in fails, check that you are using the right account for the current mode (real server or demo). The demo account is separate from any database account.

[Screenshot: sign-in page]

## Take the three-step assessment

Choose **New assessment** in the navigation. Complete the steps:

1. **About you:** age, sex, height, weight, waist size, and optional top blood-pressure reading.
2. **Habits:** activity, fruit and vegetable frequency, and smoking.
3. **Health history:** diabetes in the family, heart disease in the family, previous high blood sugar, and blood-pressure medicine.

Use **Next** to continue and **Back** to return. The form shows a progress bar. Choose **See my results** at the end.

[Screenshot: assessment step 1]

[Screenshot: assessment step 2]

[Screenshot: assessment step 3]

## Read your results

The result screen shows a section for type 2 diabetes, heart disease, and high blood pressure. Each section gives a level—lower, moderate, or higher—and lists the positive factors included in that score. It also shows your BMI and tips connected to factors in your answers. If one score is higher, or the entered systolic reading is 160 or more, the page recommends booking a checkup.

The ruler is split into three colored zones: lower, moderate, and higher. The marker indicates the score's position relative to that risk's declared maximum. A color alone is not a diagnosis.

Use **Print report** to open your browser's print dialog. This is a print view; a downloadable PDF-generation feature is **not implemented**.

[Screenshot: results page]

## View your history

Choose **My history**. Each assessment appears as a date and a short summary of risk levels. Select an item to expand its full result view.

[Screenshot: history page]

## For clinicians: review assessments

Choose **Review** in the navigation. It is available to clinician and admin roles. The page lists up to 100 recent assessments with date, patient name/email, and the three risk levels. It does not display the submitted answer set.

[Screenshot: clinician review page]

## For admins: users and roles

Choose **Users** to see account names, email addresses, and roles. Use the role selector to change another user's role to patient, clinician, or admin. The real API does not allow an admin to change their own role.

[Screenshot: admin users page]

## Sign out

Choose **Sign out** in the navigation. The real API clears the session cookie. In mock mode the local browser session value is removed.
