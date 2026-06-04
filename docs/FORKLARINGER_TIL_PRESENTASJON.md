# Forklaringer til presentasjon

Dette er korte forklaringer jeg kan bruke hvis lærer spør hvorfor jeg har gjort ulike valg i løsningen.

## Hvorfor jeg bruker roller

Jeg bruker roller fordi forskjellige brukere skal ha forskjellige rettigheter. En elev skal kunne lage og se egne saker. En lærer skal kunne lese saker, svare og endre status. Admin skal kunne administrere brukere, saker og logger.

Dette gjør systemet tryggere, fordi ikke alle brukere får tilgang til alt.

## Hvorfor passord hashes

Passord hashes fordi passord ikke skal lagres som vanlig tekst i databasen. Hvis noen får tilgang til databasen, skal de ikke kunne lese passordene direkte.

Jeg bruker bcrypt til hashing. Når brukeren logger inn, sammenligner serveren passordet med hashen som ligger i databasen.

## Hvordan createdBy kobler sak til bruker

Feltet `createdBy` i Issue-modellen lagrer id-en til brukeren som opprettet saken. Det betyr at hver sak kan kobles til en bestemt bruker.

Dette brukes for at elever bare skal se sine egne saker. Lærer og admin kan se alle saker fordi de har høyere rolle.

## Hvordan Node.js kobler til MongoDB

Node.js kobler til MongoDB med Mongoose. Adressen til databasen ligger i `.env` som `MONGODB_URI`.

I prosjektet peker `MONGODB_URI` til MongoDB-VM-en:

```text
mongodb://10.12.13.216:27017/eksamenit26
```

Node.js-serveren kjører på en egen VM, og MongoDB kjører på en annen VM. Node.js sender og henter data fra MongoDB gjennom denne koblingen.

## Hvordan API-et skiller seg fra EJS-sider

EJS-sider viser HTML i nettleseren. Det brukes når brukeren klikker rundt på nettsiden.

API-et sender data som JSON. Det betyr at API-et ikke viser en ferdig nettside, men sender rene data som for eksempel saker, brukere eller logger.

Kort sagt:

- EJS viser nettsider.
- API sender og mottar data.

## Hva jeg gjorde for GDPR og sikkerhet

Jeg lagrer bare data som trengs for systemet, for eksempel brukernavn, rolle, saker og logger. Jeg lagrer ikke unødvendige personopplysninger som adresse eller fødselsnummer.

For sikkerhet har jeg brukt:

- passord-hash med bcrypt
- rollebasert tilgang
- sessions for innlogging
- auth logs for login, logout og failed login
- validering av skjemaer
- adminfunksjoner for å slette brukere og saker

Dette gjør at persondata håndteres mer kontrollert.

## Hvordan jeg testet med elev, lærer og admin

Jeg testet systemet med ulike roller.

Som elev testet jeg:

- registrering og innlogging
- opprette sak
- se egne saker
- åpne sak
- endre status på egen sak

Som lærer testet jeg:

- logge inn
- se saker
- åpne en sak
- skrive lærersvar
- endre status

Som admin testet jeg:

- logge inn
- se adminpanelet
- opprette bruker
- endre rolle
- slette bruker
- slette sak
- se auth logs

Dette viser at rollebasert tilgang fungerer i praksis.
