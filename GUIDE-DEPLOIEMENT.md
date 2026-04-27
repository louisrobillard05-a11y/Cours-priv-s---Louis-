# 🎾 Ace Tennis Coaching — Guide de déploiement

## Ce que tu vas obtenir
- **acetenniscoaching.vercel.app** (ou ton propre domaine) — page client pour les réservations
- **acetenniscoaching.vercel.app/coach** — ton tableau de bord protégé par mot de passe
- Sync Outlook automatique (.ics) à chaque réservation
- Emails de confirmation automatiques
- SMS de rappel 24h avant (via Twilio)
- **100% gratuit** (sauf SMS ~$0.01 CAD/message)

---

## ÉTAPE 1 — Supabase (base de données, gratuit)

1. Va sur **https://supabase.com** → Create account → New project
2. Note ton **Project URL** et ta **anon key** (Settings > API)
3. Va dans **SQL Editor** → New query
4. Copie-colle tout le contenu de `supabase-schema.sql` → Run
5. Tes tables sont créées avec les parcs par défaut!

---

## ÉTAPE 2 — Resend (emails, gratuit 3000/mois)

1. Va sur **https://resend.com** → Create account
2. Add Domain (optionnel — tu peux utiliser leur domaine gratuit pour commencer)
3. API Keys → Create API Key → copie-le

---

## ÉTAPE 3 — Twilio (SMS, ~$0.01/message)

1. Va sur **https://twilio.com** → Create account
2. Get a free number (choisir un numéro canadien)
3. Note: Account SID, Auth Token, et ton numéro Twilio
4. ⚠️ Compte gratuit = seulement envoyer à des numéros vérifiés. Pour envoyer à tous tes clients, upgrade à ~$15 USD une fois.

---

## ÉTAPE 4 — Vercel (hébergement, gratuit)

1. Va sur **https://vercel.com** → Create account (connecte avec GitHub)
2. Sur GitHub, crée un nouveau repo et pousse ce dossier:
   ```bash
   cd ace-tennis
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/TON_USERNAME/ace-tennis.git
   git push -u origin main
   ```
3. Dans Vercel → New Project → importe ton repo GitHub
4. Dans **Environment Variables**, ajoute toutes les variables de `.env.example`:

   | Nom | Valeur |
   |-----|--------|
   | NEXT_PUBLIC_SUPABASE_URL | ton URL supabase |
   | NEXT_PUBLIC_SUPABASE_ANON_KEY | ta clé anon |
   | SUPABASE_SERVICE_KEY | ta service key |
   | COACH_PASSWORD | ton mot de passe (ex: tennis2024!) |
   | RESEND_API_KEY | ta clé Resend |
   | COACH_EMAIL | ton email |
   | TWILIO_ACCOUNT_SID | ton SID Twilio |
   | TWILIO_AUTH_TOKEN | ton token Twilio |
   | TWILIO_PHONE_NUMBER | +1XXXXXXXXXX |
   | COACH_PHONE | ton numéro |
   | NEXT_PUBLIC_APP_URL | https://ton-app.vercel.app |
   | CRON_SECRET | un mot de passe random pour sécuriser les rappels |

5. Deploy → ton app est en ligne!

---

## ÉTAPE 5 — Rappels automatiques (cron)

Le fichier `vercel.json` configure un cron job qui envoie automatiquement les rappels email+SMS chaque jour à 9h AM (UTC = 5h AM EST).

Pour que ça fonctionne, ajoute dans Vercel → Settings → Cron Jobs que le header `x-cron-secret` contient ta valeur `CRON_SECRET`.

---

## Utilisation au quotidien

### Ajouter des disponibilités
1. Va sur **ton-app.vercel.app/coach**
2. Entre ton mot de passe
3. Onglet **Créneaux** → choisis le parc, la date, les heures → Ajouter
4. Tes clients voient immédiatement le créneau sur **/book**

### Bloquer un parc matin / autre parc après-midi
1. Ajoute un créneau: **Parc Fontainebleau** de 8h à 12h
2. Ajoute un créneau: **Parc Jarry** de 13h à 17h
3. Ou utilise le bouton 🔒 **Bloquer** sur n'importe quel créneau existant

### Envoyer le lien à tes clients
Envoie simplement: `https://ton-app.vercel.app/book`
(ou /book?lang=en pour la version anglaise)

### Sync Outlook
Chaque client reçoit automatiquement un fichier `.ics` par email.
Il clique dessus → Outlook s'ouvre → événement ajouté en 1 clic.

---

## Domaine personnalisé (optionnel, ~$15 CAD/an)
1. Achète `acetenniscoaching.ca` sur **namecheap.com** ou **godaddy.com**
2. Dans Vercel → Settings → Domains → ajoute ton domaine
3. Suis les instructions DNS

---

## Support
Des questions? Reviens me voir sur Claude — je peux t'aider à déboguer ou ajouter des fonctionnalités!
