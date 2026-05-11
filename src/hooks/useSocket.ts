'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { user, token } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('auth', { userId: user.id, userName: user.name });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const joinDocument = useCallback((documentId: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit('document:join', { documentId, userId: user.id });
    }
  }, [user]);

  const leaveDocument = useCallback((documentId: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit('document:leave', { documentId, userId: user.id });
    }
  }, [user]);

  const onNotification = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('notification:new', callback);
      return () => socketRef.current?.off('notification:new', callback);
    }
    return () => {};
  }, []);

  const onCommentAdded = useCallback((documentId: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('comment:added', callback);
      return () => socketRef.current?.off('comment:added', callback);
    }
    return () => {};
  }, []);

  const onPresenceUpdate = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('presence:update', callback);
      return () => socketRef.current?.off('presence:update', callback);
    }
    return () => {};
  }, []);

  const emitFieldUpdate = useCallback((documentId: string, fieldId: string, updates: unknown) => {
    if (socketRef.current) {
      socketRef.current.emit('document:field-update', { documentId, fieldId, updates });
    }
  }, []);

  const emitSigned = useCallback((documentId: string, signerId: string, signerName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('document:signed', { documentId, signerId, signerName });
    }
  }, []);

  const emitApproval = useCallback((documentId: string, action: 'approved' | 'rejected', userId: string, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('document:approval', { documentId, action, userId, userName });
    }
  }, []);

  const emitNewComment = useCallback((documentId: string, userId: string, userName: string, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('comment:new', { documentId, userId, userName, content });
    }
  }, []);

  const emitTyping = useCallback((documentId: string, userId: string, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('comment:typing', { documentId, userId, userName });
    }
  }, []);

  const onFieldUpdated = useCallback((callback: (data: unknown) => void) => {
    if (socketRef.current) {
      socketRef.current.on('document:field-updated', callback);
      return () => socketRef.current?.off('document:field-updated', callback);
    }
    return () => {};
  }, []);

  const onUserJoined = useCallback((callback: (data: unknown) => void) => {
    if (socketRef.current) {
      socketRef.current.on('document:user-joined', callback);
      return () => socketRef.current?.off('document:user-joined', callback);
    }
    return () => {};
  }, []);

  const onUserLeft = useCallback((callback: (data: unknown) => void) => {
    if (socketRef.current) {
      socketRef.current.on('document:user-left', callback);
      return () => socketRef.current?.off('document:user-left', callback);
    }
    return () => {};
  }, []);

  const onUserTyping = useCallback((callback: (data: unknown) => void) => {
    if (socketRef.current) {
      socketRef.current.on('comment:user-typing', callback);
      return () => socketRef.current?.off('comment:user-typing', callback);
    }
    return () => {};
  }, []);

  return {
    isConnected,
    joinDocument,
    leaveDocument,
    emitFieldUpdate,
    emitSigned,
    emitApproval,
    emitNewComment,
    emitTyping,
    onNotification,
    onCommentAdded,
    onPresenceUpdate,
    onFieldUpdated,
    onUserJoined,
    onUserLeft,
    onUserTyping,
  };
}
