# Prompt pentru Copilot — Aplicație de programări salon unghii

## Context proiect

Vreau să construiesc o aplicație web de programări (appointments) pentru un salon de unghii cu UN SINGUR meșter/manager (eu). Aplicația are doi tipuri de utilizatori:

1. **Manager/Admin** (autentificat) — poate marca manual ce ore/zile sunt disponibile pentru programări, fie individual, fie în bloc (ex: "luni-vineri, 10:00-18:00, sloturi de 2h"). Poate vedea toate programările făcute de clienți.
2. **Client** (fără cont, acces public pe link) — vede un calendar (cu vizualizare lună) și poate alege doar dintre orele marcate ca disponibile de manager. Completează un formular scurt (nume, telefon, eventual serviciul dorit, instagram) și rezervă slotul. Odată rezervat, slotul devine indisponibil pentru alți clienți (fără double-booking).

## Stack tehnic ales

- **Frontend:** React
- **Backend/DB:** Supabase (Postgres + Auth + API), ca să evit un server propriu
- **Hosting:** Vercel (plan gratuit)
- **Domeniu:** subdomeniu gratis Vercel pentru început (`numesalon.vercel.app`), opțional domeniu propriu mai târziu

## Schema de date (Supabase / Postgres)

Trei tabele principale:

### `services` (opțional, dar recomandat)
- `id` (uuid, PK)
- `name` (text) — ex: "Manichiură simplă", "Gelish"
- `duration_minutes` (int) — durata serviciului, folosită pentru a genera sloturi
- `price` (numeric, opțional)

### `available_slots`
- `id` (uuid, PK)
- `date` (date)
- `start_time` (time)
- `end_time` (time)
- `is_booked` (boolean, default false)
- `created_by` (referință la manager, dacă există auth)

### `appointments`
- `id` (uuid, PK)
- `slot_id` (FK către `available_slots`)
- `client_name` (text)
- `client_phone` (text)
- `service_id` (FK către `services`, opțional)
- `created_at` (timestamp)
- `status` (text: "confirmed", "cancelled")

## Reguli de securitate (RLS în Supabase)

- Clienții (anon) pot: citi sloturile disponibile (`is_booked = false`), insera o programare nouă.
- Clienții NU pot: modifica sau șterge sloturi, citi datele altor clienți din `appointments`.
- Doar manager-ul autentificat poate: crea/edita/șterge sloturi, vedea toate programările, anula o programare.

## Fluxul aplicației

1. Manager se autentifică (Supabase Auth, simplu email+parolă).
2. Manager vede un calendar admin și poate marca ore disponibile individual sau în bloc (interval de zile + interval orar + durată slot).
3. Client accesează link-ul public, vede calendarul cu vizualizare lună, vede doar sloturile libere.
4. Client alege un slot, completează formular (nume, telefon, serviciu opțional, instagram), trimite.
5. La trimitere: se creează o intrare în `appointments` ȘI slotul corespunzător din `available_slots` se marchează `is_booked = true` (ideal într-o singură tranzacție / funcție Supabase, ca să nu existe race condition între doi clienți care aleg simultan același slot).
6. Manager vede în panoul admin lista programărilor viitoare, care trebuie sa le confirme, poate anula una (eliberând slotul înapoi).

## Ce vreau să construim împreună, pas cu pas

Lucrăm iterativ, o bucată mică odată, nu tot proiectul dintr-odată. Ordinea preferată:

1. Schema SQL completă pentru Supabase (cele 3 tabele + politici RLS)
2. Componenta de calendar public (afișare zi/săptămână/lună, evidențiere sloturi libere)
3. Funcția/componenta de rezervare (formular client + salvare în Supabase + marcare slot ca ocupat, cu protecție împotriva dublei rezervări)
4. Panoul de admin: autentificare + listă programări
5. Panoul de admin: interfață de marcare ore disponibile (individual și în bloc)
6. (Opțional, fază 2) Notificări email/SMS la confirmare programare

## Cerințe de stil de lucru

- Dă-mi cod fișier cu fișier, nu tot proiectul într-un singur răspuns.
- Explică-mi pe scurt ce face fiecare bucată de cod înainte sau după ce o scrii.
- Dacă o decizie de design nu e clară din contextul de mai sus (ex: cum exact vreau să arate "marcarea în bloc"), întreabă-mă înainte să presupui.
- Folosește practici curente pentru React + Supabase (hooks, client Supabase, etc.), fără biblioteci inutile/excesive.

---

**Începe cu pasul 1: schema SQL completă pentru Supabase, inclusiv politicile RLS descrise mai sus.**
