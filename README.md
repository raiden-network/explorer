# Status page

Requires NodeJS and npm.

## Mock endpoint
Serv test data by running mock endpoint on `localhost:4567`:
```bash
cd mock
node serv.js
```

## Dev run
Install angular globally and run the ng dev server:
```bash
npm install -g @angular/cli
cd angular-app
npm install
ng serve
```

## Production
```bash
cd angular-app
ng build --prod # with production flag
cd ..
docker-compose up -d webui
```

## Configuration
Change endpoint location in `angular-app/src/assets/config.ts`.
