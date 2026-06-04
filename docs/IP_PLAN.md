# IP-plan

Dette er IP-planen for eksamensprosjektet.

## Servere

| Navn | IP-adresse | Rolle | Bruk |
| --- | --- | --- | --- |
| eksamen1 | 10.12.13.216 | MongoDB-server | Lagrer brukere, saker og logger |
| eksamen2 | 10.12.13.217 | Node.js-server | Kjører nettsiden, Express, EJS og API |

## Porter

| Server | Port | Tjeneste | Forklaring |
| --- | --- | --- | --- |
| 10.12.13.216 | 27017 | MongoDB | Database som Node.js kobler til |
| 10.12.13.217 | 3000 | Node.js/Express | Nettsiden og API-et |
| 10.12.13.216 | 22 | SSH | Administrasjon av MongoDB-VM |
| 10.12.13.217 | 22 | SSH | Administrasjon av Node.js-VM |

## Koblinger

Node.js-serveren kobler til MongoDB med denne adressen:

```text
mongodb://10.12.13.216:27017/eksamenit26
```

Brukere åpner nettsiden med denne adressen:

```text
http://10.12.13.217:3000
```

## Forklaring

MongoDB og Node.js ligger på hver sin VM. Dette gjør at databasen og webserveren har forskjellige roller i nettverket.

```text
Bruker -> Node.js-server -> MongoDB-server
```

Node.js-serveren viser nettsiden og sender eller henter data fra MongoDB-serveren.

## Nettverksdiagram

Bildefil:

```text
docs/diagrams/ip-plan.svg
```

```text
                 Bruker / nettleser
                         |
                         | HTTP port 3000
                         v
              10.12.13.217 - eksamen2
              Node.js / Express / EJS / API
                         |
                         | MongoDB port 27017
                         v
              10.12.13.216 - eksamen1
                    MongoDB database
```

## Serverroller

```text
eksamen2:
- Tar imot HTTP-trafikk fra brukeren
- Kjører Node.js og Express
- Viser EJS-sider
- Har API-routes
- Sender og henter data fra MongoDB

eksamen1:
- Kjører MongoDB
- Lagrer users, issues og authlogs
- Tar bare imot databasetrafikk fra Node.js-serveren
```
