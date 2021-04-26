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

    const allMessages = await messagesService.listByUser(user_id);

    socket.emit('client_list_all_messages', allMessages);

    const allUsers = await connectionsService.findAllWithoutAdmin();

    websocket.emit('admin_list_all_users', allUsers);
  });

  socket.on('client_send_to_admin', async params => {
    const { text, socket_admin_id } = params;

    const socket_id = socket.id;

    const { user_id } = await connectionsService.findBySocketId(socket_id);

    const message = await messagesService.create({
      text,
      user_id
    });

    websocket.to(socket_admin_id).emit('admin_receive_message', {
      message,
      socket_id
    });
  });
});