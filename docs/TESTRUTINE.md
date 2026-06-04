# Testrutine

Dette er en testrutine som kan brukes for å demonstrere at løsningen fungerer, og for å vise at systemet er riktig rullet ut på VM-ene.

## Mål med testen

Målet er å vise at løsningen fungerer i henhold til oppgaven:

- elever kan registrere utfordringer
- lærere kan lese saker, svare og endre status
- elever kan svare på løsningen læreren foreslår
- admin kan administrere brukere, saker og logger
- data lagres i MongoDB
- Node.js-serveren kjører på egen VM
- MongoDB kjører på egen VM

## 1. Driftstest

Denne testen viser at systemet er rullet ut riktig.

### Node.js-server

Kjør på Node.js-VM:

```bash
cd ~/eksamenit26
npm start
```

Forventet resultat:

```text
Server kjører på http://localhost:3000
Koblet til MongoDB
```

Test fra Mac eller klient:

```bash
curl -I http://10.12.13.217:3000
```

Forventet resultat:

```text
HTTP/1.1 200 OK
```

### MongoDB-server

Kjør på MongoDB-VM:

```bash
sudo systemctl status mongod
```

Forventet resultat:

```text
active (running)
```

## 2. Databasetest

Denne testen viser at data faktisk lagres i MongoDB.

Kjør på MongoDB-VM:

```bash
mongosh
```

Kjør deretter:

```js
show dbs
use eksamenit26
show collections
db.users.find({}, { username: 1, role: 1, _id: 0 }).pretty()
db.issues.find().pretty()
db.authlogs.find().pretty()
```

Forventet resultat:

- `users` viser brukere og roller
- `issues` viser saker
- `authlogs` viser login, logout og failed login

## 3. Test med elev

Logg inn som elev.

Test:

1. Registrer eller logg inn som elev.
2. Gå til **Saker**.
3. Opprett en ny sak.
4. Fyll inn tittel, kategori og beskrivelse.
5. Lagre saken.
6. Åpne saken igjen.
7. Sjekk at saken vises for eleven.
8. Endre status på egen sak.
9. Når lærer har svart, skriv et svar på den foreslåtte løsningen.

Forventet resultat:

- elev kan opprette sak
- elev kan se egne saker
- elev kan ikke se andre elevers saker
- elev kan endre status på egen sak
- elev kan svare på lærers foreslåtte løsning
- elev kan maks opprette 5 saker

## 4. Test med lærer

Logg inn som lærer.

Test:

1. Gå til **Saker**.
2. Åpne en sak som er sendt inn av elev.
3. Skriv lærersvar.
4. Endre status til **under arbeid** eller **løst**.
5. Sjekk at elevens svar på løsningen vises når eleven har svart.

Forventet resultat:

- lærer kan se saker
- lærer kan skrive svar
- lærer kan endre status
- lærer kan se elevens svar på foreslått løsning
- lærer kan ikke bruke adminpanelet

## 5. Test med admin

Logg inn som admin.

Test:

1. Gå til **Admin**.
2. Opprett en ny bruker.
3. Endre rolle på en bruker.
4. Slett en sak.
5. Sjekk auth logs.
6. Prøv failed login med feil passord og se om det logges.

Forventet resultat:

- admin kan opprette brukere
- admin kan endre roller
- admin kan slette brukere og saker
- admin kan se auth logs
- failed login blir logget

## 6. API-test

API-et kan testes når man er logget inn i nettleseren, eller med verktøy som Postman/curl med session-cookie.

Eksempler på API-endepunkter:

```text
GET /api/issues
GET /api/users
GET /api/authlogs
GET /api/critical-events
POST /api/issues/:id/student-response
```

Forventet resultat:

- API-et sender JSON
- elev får bare egne saker
- elev kan svare på lærers foreslåtte løsning via API
- admin kan hente brukere og logger
- bruker uten riktig rolle får ikke tilgang

## 7. Sikkerhetstest

Test:

1. Logg ut.
2. Prøv å åpne `/issues`.
3. Prøv å åpne `/admin` som elev eller lærer.
4. Prøv å logge inn med feil passord.

Forventet resultat:

- brukere som ikke er logget inn sendes til login
- elev og lærer får ikke tilgang til admin
- failed login lagres i auth logs

## Kjente avvik

Det er normalt å ha noen avvik når en løsning lages under tidspress.

### Avvik 1: Kategorier er fritekst

I løsningen kan brukeren skrive kategori selv. Det fungerer, men det kan føre til ulike skrivemåter, for eksempel `nettverk`, `Nettverk` og `netverk`.

Tiltak:

- lage faste kategorier i en dropdown
- validere kategorien på serveren
- dokumentere hvilke kategorier som er lov

### Avvik 2: Kritiske hendelser er enkle

Kritiske hendelser er basert på failed login og åpne saker. Det finnes ikke en stor egen visuell side kun for kritiske hendelser.

Tiltak:

- lage en egen adminside for kritiske hendelser
- markere saker med kategori `kritisk`
- lage tydeligere varsling i adminpanelet

### Avvik 3: Serveren startes manuelt

Node.js-serveren startes med `npm start`. Hvis terminalen lukkes, kan serveren stoppe.

Tiltak:

- sette opp PM2 eller systemd-service
- gjøre at Node.js starter automatisk etter restart
- dokumentere restart-rutine

### Avvik 4: Ingen avansert backup

MongoDB lagrer data, men det er ikke satt opp avansert automatisk backup.

Tiltak:

- lage backup-rutine med `mongodump`
- lagre backup på sikkert sted
- teste restore fra backup

## Kort konklusjon

Testene viser at hovedfunksjonene fungerer: innlogging, roller, saker, lærersvar, elevsvar på foreslått løsning, adminpanel, API og MongoDB-lagring. Avvikene er kjente og kan forklares. De viktigste forbedringene videre ville vært faste kategorier, bedre kritiske hendelser, automatisk drift av Node.js og backup-rutine.
