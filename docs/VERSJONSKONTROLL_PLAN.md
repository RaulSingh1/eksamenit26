# Plan for versjonskontroll

Dette er planen for hvordan versjonskontroll brukes i utviklingsarbeidet.

## Verktøy

Prosjektet bruker Git og GitHub til versjonskontroll. Koden ligger i et GitHub-repository, og endringer pushes dit etter at de er testet.

## Arbeidsflyt

1. Først gjør jeg endringer lokalt i VS Code.
2. Etterpå tester jeg at siden fortsatt fungerer.
3. Jeg sjekker hvilke filer som er endret med `git status`.
4. Endringene legges til med `git add`.
5. Jeg lager en commit med en kort forklaring.
6. Til slutt pushes endringen til GitHub.

Eksempel på kommandoer:

```bash
git status
git add .
git commit -m "Kort forklaring av endringen"
git push
```

## Bruk på Node.js-VM

Node.js-serveren henter siste versjon av prosjektet fra GitHub. Når koden er pushet, kan serveren oppdateres med:

```bash
cd ~/eksamenit26
git pull
npm start
```

Hvis serveren allerede kjører, må den gamle prosessen stoppes før den startes på nytt.

## Hvorfor versjonskontroll er viktig

Versjonskontroll gjør det lettere å følge med på hva som er endret i prosjektet. Hvis noe slutter å fungere, kan jeg se hvilke filer som ble endret sist. GitHub fungerer også som en trygg kopi av prosjektet.

## Hvordan det er brukt i prosjektet

I dette prosjektet er versjonskontroll brukt til å lagre endringer underveis, for eksempel:

- oppsett av Node.js og Express
- EJS-sider og CSS
- MongoDB-modeller
- innlogging og roller
- adminfunksjoner
- API-routes
- dokumentasjon som IP-plan, ER-diagram og risikoanalyse

## Kort vurdering

Jeg bruker Git og GitHub for å jobbe mer strukturert. Det gjør at utviklingen blir tryggere, fordi jeg kan lagre fungerende versjoner og hente dem på Node.js-VM-en når nettsiden skal kjøres.
