# 🎓 מעבדת למידה — Learning Lab

מערכת לבניית **סביבות למידה אינטראקטיביות**: כל סביבה בנויה משלבים (שקופיות),
עם סרגל ניווט מספרי בתחתית המסך, מצבי תצוגה למרצה, מצב לומד ציבורי ותעודת סיום
אוטומטית בסוף התהליך.

## מה יש במערכת

| תפקיד | כניסה | יכולות |
| --- | --- | --- |
| **מנהל מערכת** | שם משתמש + סיסמה | רישום מרצים חדשים, קביעת סיסמה ראשונית, השעיית משתמשים |
| **מרצה / יוצר** | שם משתמש + סיסמה | בניית סביבות, מעבר בין מצב עריכה ↔ תצוגה ↔ לומד, שינוי סיסמה, קישור שיתוף |
| **לומד** | ללא כניסה — רק קישור | מצב לומד בלבד, ובסופו תעודה |

**פרטיות הלומדים:** המערכת אינה שומרת דבר על הלומדים — לא שם, לא תשובות, לא ציון.
הכול חי בזיכרון הדפדפן ונעלם בסגירת הלשונית. התעודה נוצרת מקומית וניתנת להדפסה
או לשמירה כ-PDF.

## הקמה מקומית

```bash
npm install
npm run dev
```

## הגדרת Firebase (חובה לפני שימוש)

1. היכנס ל-[console.firebase.google.com](https://console.firebase.google.com) וצור פרויקט חדש.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (מצב Production).
4. **Project settings → Your apps → Web (`</>`)** — רשום אפליקציה וקבל את אובייקט
   `firebaseConfig`. העתק את ערכיו לקובץ [`src/lib/firebase.js`](src/lib/firebase.js).
   *(המפתחות האלה ציבוריים מטבעם ומיועדים לרוץ בדפדפן — ההגנה האמיתית היא כללי האבטחה.)*
5. **Firestore → Rules** — הדבק את התוכן של [`firestore.rules`](firestore.rules) ולחץ Publish.

### יצירת מנהל המערכת הראשון

מנהל ראשון נוצר ידנית פעם אחת, ומשם הוא רושם את כל השאר מתוך האתר:

1. **Authentication → Users → Add user**
   - Email: `admin@users.learning-lab.local`
   - Password: בחר סיסמה
2. העתק את ה-**User UID** שנוצר.
3. **Firestore → Start collection** בשם `users`, ובתוכה מסמך שה-**Document ID**
   שלו הוא ה-UID שהעתקת, עם השדות:

   | שדה | סוג | ערך |
   | --- | --- | --- |
   | `username` | string | `admin` |
   | `displayName` | string | השם שלך |
   | `role` | string | `admin` |
   | `disabled` | boolean | `false` |
   | `mustChangePassword` | boolean | `false` |

4. עכשיו אפשר להיכנס לאתר עם שם המשתמש `admin` והסיסמה שקבעת.

> שמות משתמש ממופים פנימית לכתובת `<username>@users.learning-lab.local`,
> כי Firebase Auth דורש דוא"ל. המשתמשים לעולם לא רואים את זה.

## פרסום ל-GitHub Pages

הריפו מגיע עם workflow מוכן. פעם אחת:
**Settings → Pages → Source: GitHub Actions.** מכאן כל דחיפה ל-`main` מתפרסמת אוטומטית.

הכתובת תהיה `https://<user>.github.io/learning-lab/`.
אם תשנה את שם הריפו — עדכן את `base` ב-[`vite.config.js`](vite.config.js) בהתאם.

## מבנה הקוד

```
src/
  lib/
    firebase.js   הגדרות Firebase + מיפוי שם משתמש → דוא"ל
    auth.jsx      AuthProvider, כניסה/יציאה/שינוי סיסמה
    db.js         קריאה וכתיבה של סביבות ומשתמשים
    blocks.js     ★ רישום סוגי הכלים + חישוב הציון
    links.js      בניית קישור השיתוף ללומדים
  components/
    SlideNav.jsx      סרגל השלבים התחתון (חלון של 10 מספרים)
    BlockRenderer.jsx תצוגת בלוק ללומד
    BlockEditor.jsx   עריכת בלוק למרצה
    Certificate.jsx   תעודת הסיום
    Layout.jsx        סרגל עליון לעמודי הניהול
  pages/
    Login · Dashboard · Editor · Learn · Admin · Account
```

### הוספת כלי חדש

כל הכלים מרוכזים ב-[`src/lib/blocks.js`](src/lib/blocks.js). כדי להוסיף כלי:

1. הוסף רשומה ל-`BLOCK_TYPES` עם `label`, `icon`, `create()` — ואם הכלי נבדק,
   גם `gradable: true` ו-`grade(block, answer)`.
2. הוסף את התצוגה שלו ב-`BlockRenderer.jsx` ואת העריכה ב-`BlockEditor.jsx`.

הכלי יופיע אוטומטית בתפריט "הוסף כלי", וייכלל אוטומטית בציון ובתעודה.

כרגע קיימים שני כלים לדוגמה — **טקסט** ו**שאלה אמריקאית** — כדי שכל הצינור
(עריכה → תצוגה → למידה → ציון → תעודה) יעבוד מקצה לקצה. הכלים האמיתיים ייבנו בשלב הבא.
