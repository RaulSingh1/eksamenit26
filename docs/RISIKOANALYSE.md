# Risikoanalyse

Dette er en enkel risikoanalyse for eksamensprosjektet.

## Risikoer

| Risiko | Konsekvens | Sannsynlighet | Tiltak |
| --- | --- | --- | --- |
| Uvedkommende får tilgang til admin | Kan slette brukere, saker eller logger | Middels | Bruke roller, egen admin-bruker og passord-hash |
| Passord blir lekket | Brukere kan miste kontroll over konto | Lav | Passord lagres som hash, ikke vanlig tekst |
| MongoDB-server stopper | Nettsiden kan ikke lagre eller hente data | Middels | Kontrollere at MongoDB kjører og dokumentere serverrollen |
| Node.js-server stopper | Brukere får ikke tilgang til nettsiden | Middels | Starte serveren på nytt og dokumentere kommandoer |
| Feil rolle på bruker | Bruker kan få for mye eller for lite tilgang | Middels | Admin kan endre roller, og vanlige brukere kan ikke registrere seg som admin |
| Saker eller logger slettes ved feil | Viktig data kan forsvinne | Lav/middels | Sletteknapper har bekreftelse med JavaScript |
| Ugyldig data sendes til serveren | Feil i database eller funksjoner | Middels | Serveren sjekker felter og tillatte statuser |
| For mange failed login | Kan tyde på forsøk på innbrudd | Middels | Failed login lagres i auth logs og vises som kritisk hendelse |

## Viktigste sikkerhetstiltak

- Passord lagres med hash.
- Roller brukes for tilgangskontroll.
- Admin opprettes først med seed-script.
- Vanlige brukere kan ikke registrere seg som admin.
- Elever kan bare se og endre egne saker.
- Lærer og admin kan behandle saker.
- Innlogging, utlogging og failed login logges.
- Admin kan se logger og kritiske hendelser.

## Tiltak for å redusere risiko

### Tilgang og roller

- Bruke rollebasert tilgang slik at elever, lærere og admin har ulike rettigheter.
- Hindre at vanlige brukere kan registrere seg som admin.
- La bare admin endre roller og slette brukere.
- Hindre admin i å slette sin egen bruker.

### Passord og innlogging

- Lagre passord som hash med bcrypt.
- Ikke lagre passord i vanlig tekst.
- Logge login, logout og failed login.
- Følge med på failed login som en kritisk hendelse.

### Database

- La MongoDB ligge på egen VM.
- Bruke egen MongoDB-adresse i `.env`.
- Ikke legge `.env` ut på GitHub.
- Sjekke at MongoDB kjører hvis nettsiden ikke får hentet data.

### Sletting av data

- Bruke bekreftelse før sletting.
- Begrense sletting til admin.
- Dokumentere hva som skjer når en bruker eller sak slettes.

### Drift

- Dokumentere IP-plan og serverroller.
- Starte Node.js-serveren på nytt hvis nettsiden stopper.
- Sjekke port `3000` på Node.js-serveren.
- Sjekke port `27017` på MongoDB-serveren.

## Kort vurdering

Den største risikoen er feil tilgang til admin eller at serverne stopper. Dette reduseres med rollebasert tilgang, passord-hash, logging og dokumenterte serverroller.
