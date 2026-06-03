# GDPR-analyse

Dette er en enkel analyse av hvordan GDPR og personvern skal hensyntas i applikasjonen.

## Hvilke personopplysninger lagres

Applikasjonen lagrer bare informasjon som trengs for at systemet skal fungere:

- brukernavn
- passord som hash
- rolle, for eksempel elev, lærer eller admin
- saker som elever oppretter
- lærersvar på saker
- innloggingslogger

Systemet lagrer ikke unødvendige personopplysninger som adresse, telefonnummer eller fødselsnummer.

## Hvorfor data lagres

Brukerdata lagres for at brukere skal kunne logge inn og få riktig tilgang. Saker lagres for at elever skal kunne melde inn utfordringer, og for at lærere skal kunne svare og følge opp. Auth logs lagres for sikkerhet, slik at administrator kan se innlogging, utlogging og mislykkede innloggingsforsøk.

## Sikkerhetstiltak

Passord lagres ikke i klartekst. De lagres som hash med bcrypt, slik at passordet ikke kan leses direkte i databasen. Applikasjonen bruker også sessions for innlogging, og rollebasert tilgang for å skille mellom elev, lærer og admin.

Dette betyr at:

- elever bare får tilgang til egne saker
- lærere kan se og behandle saker
- admin kan administrere brukere, roller, saker og logger

## Dataminimering

Et viktig GDPR-prinsipp er å ikke lagre mer data enn nødvendig. Derfor lagrer systemet bare data som trengs for oppgaven. Hvis en bruker slettes av admin, slettes også sakene som hører til brukeren. Dette reduserer mengden persondata som ligger igjen i systemet.

## Tilgangskontroll

Tilgang styres med roller. Dette hindrer at alle brukere kan se alt i databasen. En elev skal for eksempel ikke kunne se saker fra andre elever eller administrere brukere. Dette beskytter personopplysninger og gjør løsningen tryggere.

## Logging

Innlogging, utlogging og failed login logges i databasen. Dette brukes for sikkerhet og kontroll. Loggene skal ikke brukes til mer enn nødvendig, og bare admin skal ha tilgang til dem.

## Vurdering

Applikasjonen tar hensyn til GDPR ved å lagre lite data, bruke passord-hash, ha rollebasert tilgang og logge viktige hendelser. Den viktigste risikoen er at feil person får tilgang til admin eller at data blir liggende for lenge. Dette reduseres med roller, sletting av data og begrenset tilgang til logger.
