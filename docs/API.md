# API-routes

API-et kjører på Node.js-serveren sammen med resten av Express-appen.

Base URL på VM:

```text
http://10.12.13.217:3000
```

## Saker

```text
GET /api/issues
```

Henter saker. Elev får egne saker. Lærer og admin får alle saker.

```text
GET /api/issues/:id
```

Henter en bestemt sak.

```text
POST /api/issues
```

Oppretter en sak. Brukes av elev og admin.

Felter:

```json
{
  "title": "Tittel",
  "description": "Beskrivelse",
  "category": "Kategori"
}
```

```text
POST /api/issues/:id/status
```

Oppdaterer status. Elev kan endre egne saker. Lærer og admin kan endre alle.

Felter:

```json
{
  "status": "løst"
}
```

```text
POST /api/issues/:id/teacher-response
```

Lærer eller admin kan legge inn svar på en sak.

Felter:

```json
{
  "teacherResponse": "Svar fra lærer"
}
```

## Brukere

```text
GET /api/users
```

Admin kan hente brukere. Passord sendes ikke med.

```text
POST /api/users
```

Admin kan opprette bruker.

Felter:

```json
{
  "username": "bruker",
  "password": "passord",
  "role": "elev"
}
```

## Logger

```text
GET /api/authlogs
```

Admin kan hente autentiseringslogger.

```text
GET /api/critical-events
```

Admin kan hente kritiske hendelser. I denne løsningen er det failed login og åpne saker.
