import { createContext, useContext } from 'react'

export interface RoomContextValue {
    joinRoom: (roomId: string) => void;
    hostRoom: (roomName: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    emitTyping: (roomId: string) => void;
}

export const RoomContext = createContext<RoomContextValue | null>(null);

export const useRoom = () => {
    const ctx = useContext(RoomContext);

    if (!ctx) {
        throw new Error('useRoom must be used within a RoomProvider');
    }

    return ctx;
}