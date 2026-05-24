import { create } from 'zustand'

interface Room {
    id: string;
    name: string;
    isHosting: boolean;
}

export interface RoomStore {
    rooms: Room[];
    activeRoomId: string | null;
    typingByRoom: Record<string, string[]>
    addRoom: (room: Room) => void;
    updateRoom: (id: string, patch: Partial<Room>) => void;
    removeRoom: (roomId: string) => void;
    setActiveRoom: (id: string) => void;
    setTyping: (roomId: string, username: string) => void;
    removeTyping: (roomId: string, username: string) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
    rooms: [],
    activeRoomId: null,
    typingByRoom: {},
    addRoom: (room) => {
        return set((s) => ({ rooms: [...s.rooms, room] }));
    },
    updateRoom: (id, patch) => {
        return set((state) => ({
            rooms: state.rooms.map((r) => r.id === id ? { ...r, ...patch } : r)
        }));
    },
    removeRoom: (roomId) => {
        return set((s) => ({
            rooms: s.rooms.filter(({ id }) => roomId !== id),
            activeRoomId: null
        }));
    },
    setActiveRoom: (id) => {
        return set(() => ({ activeRoomId: id }));
    },
    setTyping: (roomId, username) => {
        return set((s) => ({
            typingByRoom: {
                ...s.typingByRoom,
                [roomId]: Array.from(new Set([...(s.typingByRoom[roomId] ?? []), username])),
            },
        }));
    },
    removeTyping: (roomId, username) => {
        return set((s) => ({
            typingByRoom: {
                ...s.typingByRoom,
                [roomId]: (s.typingByRoom[roomId] ?? []).filter((u) => u !== username),
            },
        }));
    }
}));