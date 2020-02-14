# rekr-server
This is the repo for the rekr server, the rekr client repo can be [found here](https://github.com/ryan-lingle/rekr-client).

This application can be found at [rekr.app](https://rekr.app).
## dev setup
enter rekr-server directory
```
cd rekr-server
```
install dependencies
```
npm install
```
create and seed db
```
npx sequelize-cli db:create
npx sequelize-cli db:migrate
node src/seed.js
```
start the server
```
npm start
```
clone and enter client directory
```
git clone https://github.com/ryan-lingle/rekr-client.git
cd rekr-client
```
install client dependencies (they use different package managers oops lol)
```
yarn install
```
start client
```
yarn start
```
