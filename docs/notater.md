



En package.json-fil er hjertet i ethvert Node.js- og JavaScript-prosjekt. 
Den fungerer som et manifest eller et "identitetskort" som inneholder kritisk informasjon om prosjektet


start node: 

cd ~/eksamenit26
git pull
npm install
npm start

github push 
```bash
git status
git add .
git commit -m "Kort forklaring av endringen"
git push
```


mongo db brukere 

mongosh

Inne i mongosh, kjør i denne rekkefølgen:

js

show dbs
use eksamenit26
show collections
db.users.find().pretty()
Hvis du vil finne én bestemt bruker, for eksempel admin:

js

db.users.find({ username: "admin" }).pretty()
Hvis du bare vil se brukernavn og rolle, uten passord-hash:

js

db.users.find({}, { username: 1, role: 1, _id: 0 }).pretty()
For å gå ut av MongoDB:

js

exit