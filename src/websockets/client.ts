import { websocket } from "../http";
import { ConnectionsService } from "../services/ConnectionsService";
import { MessagesService } from "../services/MessagesService";
import { UsersService } from "../services/UsersService";

interface IParams {
  text: string;
  email: string;
}

websocket.on('connect', socket => {
  const connectionsService = new ConnectionsService();
  const usersService = new UsersService();
  const messagesService = new MessagesService();

  socket.on('client_first_access', async params => {
    const socket_id = socket.id;
    const { text, email } = params as IParams;
    let user_id = null;

    const user = await usersService.findByEmail(email);

    if (user) {
      const connection = await connectionsService.findByUserId(user.id);

      if (!connection) {
        await connectionsService.create({
          socket_id,
          user_id: user.id
        });
      } else {
        connection.socket_id = socket_id;

        await connectionsService.create(connection);
      }

      user_id = user.id;
    } else {
      const newUser = await usersService.create(email);

      await connectionsService.create({
        socket_id,
        user_id: newUser.id
      });

      user_id = newUser.id;
    }

    await messagesService.create({
      user_id,
      text
    });
  });
});