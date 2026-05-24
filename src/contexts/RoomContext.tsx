import { createContext, useContext } from 'react'
import Peer, { type DataConnection } from 'peerjs'

import { useClient } from './ClientContext'

import { useChatStore } from '../stores/chatStore'
import { useRoomStore } from '../stores/roomStore'
import { useUserStore } from '../stores/userStore'

export type Message = {
    id: string;
    userId: string;
    username: string;
    content: string;
    roomId: string;
}

export type Packet =
    | { type: 'message'; payload: Message }
    | { type: 'typing'; payload: { username: string; roomId: string } }
    | { type: 'history-request'; payload: { roomId: string } }
    | { type: 'history'; payload: { messages: Message[]; roomId: string } }
    | { type: 'room-info'; payload: { name: string } }

export interface RoomContextType {
    joinRoom: (roomId: string) => void;
    hostRoom: (roomName: string) => void;
    sendMessage: (content: string) => void;
    emitTyping: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

const hostedPeers = new Map<string, Peer>()
const roomConns = new Map<string, DataConnection[]>()
const roomHistory = new Map<string, Message[]>()
const seenMessages = new Set<string>()
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()
let typingCooldown: ReturnType<typeof setTimeout> | null = null

const safeAdd = (msg: Message) => {
    if (seenMessages.has(msg.id)) return
    seenMessages.add(msg.id)
    useChatStore.getState().addMessage(msg)
}

const relay = (packet: Packet, roomId: string, exclude: DataConnection | null) => {
    (roomConns.get(roomId) ?? [])
        .filter((c) => c !== exclude && c.open)
        .forEach((c) => c.send(packet))
}

const onPacket = (packet: Packet, roomId: string, from: DataConnection | null, isHost: boolean) => {
    const { username } = useUserStore.getState()
    const { setTyping, removeTyping } = useRoomStore.getState()

    if (packet.type === 'message') {
        const msg = { ...packet.payload, roomId }
        safeAdd(msg)
        roomHistory.set(roomId, [...(roomHistory.get(roomId) ?? []), msg])
        from?.send({ type: 'seen', payload: { messageId: packet.payload.id, username } })

        if (isHost) relay(packet, roomId, from)
    } else if (packet.type === 'typing') {
        setTyping(roomId, packet.payload.username)
        const key = `${roomId}:${packet.payload.username}`
        clearTimeout(typingTimers.get(key))
        typingTimers.set(key, setTimeout(() => removeTyping(roomId, packet.payload.username), 1200))
        if (isHost) relay(packet, roomId, from)

    } else if (packet.type === 'history-request') {
        from?.send({ type: 'history', payload: { roomId, messages: roomHistory.get(roomId) ?? [] } })

    } else if (packet.type === 'history') {
        packet.payload.messages.forEach(safeAdd)
    } else if (packet.type === 'room-info') {
        const { updateRoom } = useRoomStore.getState();
        updateRoom(roomId, { name: packet.payload.name });
    }
}

const setupConnexion = (room: DataConnection, isHost: boolean) => {
    const roomId = isHost ? room.provider.id : room.peer

    roomConns.set(roomId, [...(roomConns.get(roomId) ?? []), room]);

    room.on('data', (p) => onPacket(p as Packet, roomId, room, isHost));

    room.on('close', () => {
        roomConns.set(roomId, (roomConns.get(roomId) ?? []).filter((c) => c !== room))
    });

    room.on('open', () => {
        room.send({ type: 'history-request', payload: { roomId } })
    });

    room.on('close', () => {
        roomConns.set(roomId, (roomConns.get(roomId) ?? []).filter((c) => c !== room))

        const remaining = roomConns.get(roomId) ?? []
        if (remaining.length === 0 && !isHost) {
            useRoomStore.getState().removeRoom(roomId)
        }
    });
}

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
    const { client } = useClient()

    const joinRoom = (roomId: string) => {
        if (useRoomStore.getState().rooms.find(({ id }) => id === roomId)) return;

        const room = client.connect(roomId);

        room.on('open', () => {
            useRoomStore.getState().addRoom({ id: roomId, name: 'Loading..', isHosting: false });
            setupConnexion(room, false);
        });
    }

    const hostRoom = (roomName: string) => {
        const room = new Peer(crypto.randomUUID());

        room.on('open', () => {
            hostedPeers.set(room.id, room);
            roomConns.set(room.id, []);
            useRoomStore.getState().addRoom({ id: room.id, name: roomName, isHosting: true });
        });

        room.on('connection', (room) => {
            room.on('open', () => {
                room.send({
                    type: 'room-info',
                    payload: { name: roomName }
                });
            });

            setupConnexion(room, true);
        });
    }

    const sendMessage = (content: string) => {
        const { username } = useUserStore.getState()
        const { activeRoomId } = useRoomStore.getState()

        if (!content.trim() || !activeRoomId || !username) return

        const msg: Message = {
            id: crypto.randomUUID(),
            userId: client.id,
            username,
            content,
            roomId: activeRoomId
        }

        safeAdd(msg);

        (roomConns.get(activeRoomId) ?? [])
            .filter((c) => c.open)
            .forEach((c) => c.send({ type: 'message', payload: msg }))
    }

    const emitTyping = () => {
        const { username } = useUserStore.getState()
        const { activeRoomId } = useRoomStore.getState()

        if (typingCooldown || !activeRoomId) return
        typingCooldown = setTimeout(() => { typingCooldown = null }, 800)
            ; (roomConns.get(activeRoomId) ?? [])
                .filter((c) => c.open)
                .forEach((c) => c.send({ type: 'typing', payload: { username, roomId: activeRoomId } }))
    }

    return (
        <RoomContext.Provider value={{ joinRoom, hostRoom, sendMessage, emitTyping }}>
            {children}
        </RoomContext.Provider>
    )
}

export const useRoom = () => {
    const ctx = useContext(RoomContext)
    if (!ctx) throw new Error('useRoom must be used within a RoomProvider')
    return ctx
}