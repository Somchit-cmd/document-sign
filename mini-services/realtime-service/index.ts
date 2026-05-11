import { Server } from 'socket.io';

const io = new Server(3003, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track connected users
const connectedUsers = new Map<string, { socketId: string; userId: string; userName: string }>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication
  socket.on('auth', (data: { userId: string; userName: string }) => {
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId: data.userId,
      userName: data.userName,
    });
    // Join user's personal room
    socket.join(`user:${data.userId}`);
    // Broadcast user online status
    io.emit('presence:update', { userId: data.userId, status: 'online' });
    console.log(`User ${data.userName} authenticated`);
  });

  // Join document room for collaboration
  socket.on('document:join', (data: { documentId: string; userId: string }) => {
    socket.join(`doc:${data.documentId}`);
    // Notify others in the room
    socket.to(`doc:${data.documentId}`).emit('document:user-joined', {
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave document room
  socket.on('document:leave', (data: { documentId: string; userId: string }) => {
    socket.leave(`doc:${data.documentId}`);
    socket.to(`doc:${data.documentId}`).emit('document:user-left', {
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Document field updates (during editing)
  socket.on('document:field-update', (data: { documentId: string; fieldId: string; updates: any }) => {
    socket.to(`doc:${data.documentId}`).emit('document:field-updated', {
      fieldId: data.fieldId,
      updates: data.updates,
      timestamp: new Date().toISOString(),
    });
  });

  // Document signed event
  socket.on('document:signed', (data: { documentId: string; signerId: string; signerName: string }) => {
    io.emit('notification:new', {
      type: 'signed',
      title: 'Document Signed',
      message: `${data.signerName} signed a document`,
      documentId: data.documentId,
      timestamp: new Date().toISOString(),
    });
  });

  // Approval action event
  socket.on('document:approval', (data: { documentId: string; action: 'approved' | 'rejected'; userId: string; userName: string }) => {
    io.emit('notification:new', {
      type: data.action,
      title: data.action === 'approved' ? 'Document Approved' : 'Document Rejected',
      message: `${data.userName} ${data.action} a document`,
      documentId: data.documentId,
      timestamp: new Date().toISOString(),
    });
  });

  // Comment added
  socket.on('comment:new', (data: { documentId: string; userId: string; userName: string; content: string }) => {
    socket.to(`doc:${data.documentId}`).emit('comment:added', {
      userId: data.userId,
      userName: data.userName,
      content: data.content,
      timestamp: new Date().toISOString(),
    });
  });

  // Typing indicator for comments
  socket.on('comment:typing', (data: { documentId: string; userId: string; userName: string }) => {
    socket.to(`doc:${data.documentId}`).emit('comment:user-typing', {
      userId: data.userId,
      userName: data.userName,
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      io.emit('presence:update', { userId: user.userId, status: 'offline' });
      connectedUsers.delete(socket.id);
      console.log(`User ${user.userName} disconnected`);
    }
  });
});

console.log('Real-time service running on port 3003');
