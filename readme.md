# File Upload Tester
This app can be deployed to a server of your choice with minimal dependancies (npde/npm) so that you or users can test upload speed or network conditions from a web client via the browser to the server.

## User Stories
- I am an app developer and need to test the upload throughput from client to server via http. 
- I am a network engineer that needs to run WireShark captures uploding to a server in my control via http.

## Dependancies
- node.js

## How to Install/Run
- Place onto the target server via git pull, or download/extract.
- run `npm start` to generate the appConfig.json file. 
- update the appConfig.json with the basic auth credentials of your choosing
- run `npm start` once more to start the app, the app hosts to http://localhost:3001


## Features
- Allows the user to generate, or select an existing file.
- Upload that file repeatedly on an interval at the users choosing.
- Upload that file using many streams.
- See the timestamps at each point of each upload, the round trip time, and the estimated transfer speed.

## TODOS
- [ ] Allow user to change port via appSettings.json
- [ ] Display a running summary of avg throughput and files per minute.
- [ ] Instead of always displaying all results, show the last stream count. ie. if the usere sets the streams to 10, only the last 10 results will show. This is because the avg throughput and files per minute will be more useful anyways.

## Additional Notes
This tool was designed to turn on, test, and then turn off. Basic auth is not foolproof. If you choose to keep this continually running, please follow all best practices for hosting a node app for production.

this is a small project, and was made out of necessity. After the todo's above I will likely not do much more unless this magically gets discovered and people need other features. 
