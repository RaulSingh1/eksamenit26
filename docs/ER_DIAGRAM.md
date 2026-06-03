# ER-diagram

Dette ER-diagrammet viser de viktigste collections i MongoDB.

```text
┌────────────────────┐
│       users        │
├────────────────────┤
│ _id                │
│ username           │
│ password           │
│ role               │
└─────────┬──────────┘
          │
          │ 1 bruker kan ha mange saker
          │
          v
┌────────────────────┐
│       issues       │
├────────────────────┤
│ _id                │
│ title              │
│ description        │
│ category           │
│ status             │
│ createdBy          │
│ teacherResponse    │
│ createdAt          │
└────────────────────┘

┌────────────────────┐
│      authlogs      │
├────────────────────┤
│ _id                │
│ username           │
│ action             │
│ timestamp          │
└────────────────────┘
```

## Forklaring

```text
users
```

Lagrer brukere i systemet. Brukeren har brukernavn, hashet passord og rolle.

```text
issues
```

Lagrer saker som elever oppretter. Feltet `createdBy` peker til brukeren som laget saken.

```text
authlogs
```

Lagrer innlogging, utlogging og failed login. Denne collectionen bruker `username` for å vise hvem hendelsen gjelder.

## Relasjon

```text
users 1 ─── mange issues
```

En bruker kan opprette flere saker, men hver sak er laget av én bruker.
