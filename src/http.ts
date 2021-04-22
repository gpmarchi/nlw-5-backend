import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

import './database';
import { routes } from './routes';

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));
app.set('views', path.join(__dirname, '..', 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const http = createServer(app);
const websocket = new Server(http);

websocket.on('connection', (socket: Socket) => {
  console.log('Se conectou', socket.id);
});

app.use(express.json());

app.use(routes);

app.get('/pages/client', (request, response) => {
  return response.render('html/client.html');
});

export { http, websocket };