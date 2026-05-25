import { createContext, useContext, useEffect } from 'react'
import Peer, { type DataConnection } from 'peerjs'

import { useClient } from './ClientContext'

import { useChatStore } from '../stores/chatStore'
import { useRoomStore, type Member } from '../stores/roomStore'
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
    | { type: 'room-info'; payload: { name: string, members: Member[] } }
    | { type: 'join'; payload: { userId: string; username: string } }
    | { type: 'leave'; payload: { userId: string } }
    | { type: 'call-request'; payload: { from: string; username: string } }
    | { type: 'call-declined'; payload: { from: string } }

export interface RoomContextType {
    joinRoom: (roomId: string) => void;
    hostRoom: (roomName: string) => void;
    sendMessage: (content: string) => void;
    startCall: (roomId: string) => void;
    acceptCall: () => void
    declineCall: () => void
    emitTyping: () => void;
    hangUp: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

const connUsers = new Map<DataConnection, string>();
const hostedPeers = new Map<string, Peer>()
const roomConns = new Map<string, DataConnection[]>()
const roomHistory = new Map<string, Message[]>()
const seenMessages = new Set<string>()
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()
let typingCooldown: ReturnType<typeof setTimeout> | null = null
let localStream: MediaStream | null = null

const getLocalStream = async () => {
    if (localStream) return localStream;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return localStream;
}

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
    const { setTyping, removeTyping } = useRoomStore.getState()

    if (packet.type === 'message') {
        const msg = { ...packet.payload, roomId }
        safeAdd(msg);
        roomHistory.set(roomId, [...(roomHistory.get(roomId) ?? []), msg]);
        if (isHost) relay(packet, roomId, from);
    } else if (packet.type === 'typing') {
        setTyping(roomId, packet.payload.username)
        const key = `${roomId}:${packet.payload.username}`
        clearTimeout(typingTimers.get(key))
        typingTimers.set(key, setTimeout(() => removeTyping(roomId, packet.payload.username), 1200))
        if (isHost) relay(packet, roomId, from)
    } else if (packet.type === 'history-request') {
        from?.send({ type: 'history', payload: { roomId, messages: roomHistory.get(roomId) ?? [] } });
    } else if (packet.type === 'history') {
        packet.payload.messages.forEach(safeAdd);
    } else if (packet.type === 'room-info') {
        const { updateRoom, addMember } = useRoomStore.getState()
        updateRoom(roomId, { name: packet.payload.name })
        packet.payload.members.forEach((m) => addMember(roomId, m))
    } else if (packet.type === 'join') {
        connUsers.set(from!, packet.payload.userId)
        useRoomStore.getState().addMember(roomId, packet.payload)
        if (isHost) relay(packet, roomId, from)
    } else if (packet.type === 'leave') {
        useRoomStore.getState().removeMember(roomId, packet.payload.userId)
        if (isHost) relay(packet, roomId, from)
    } else if (packet.type === 'call-request') {
        useRoomStore.getState().setIncomingCall(roomId, packet.payload);
    } else if (packet.type === 'call-declined') {
        useRoomStore.getState().removeCallPeer(packet.payload.from)
        if ((useRoomStore.getState().activeCall?.peers.length ?? 0) <= 1) {
            useRoomStore.getState().clearActiveCall()
        }
    }
}

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
    const { client } = useClient()
    const { addRemoteStream } = useRoomStore.getState();

    useEffect(() => {
        client.on('call', async (call) => {
            const stream = await getLocalStream()
            call.answer(stream)
            call.on('stream', (remoteStream) => addRemoteStream(call.peer, remoteStream))
        });
    }, []);

    const startCall = async (roomId: string) => {
        const stream = await getLocalStream()
        const { username } = useUserStore.getState()

        useRoomStore.getState().setActiveCall(roomId, [client.id])

            ; (roomConns.get(roomId) ?? []).forEach((conn) => {
                conn.send({ type: 'call-request', payload: { from: client.id, username: username! } })
                const call = client.call(conn.peer, stream)
                call.on('stream', (remoteStream) => {
                    useRoomStore.getState().addRemoteStream(conn.peer, remoteStream)
                    useRoomStore.getState().addCallPeer(conn.peer)
                })
            })
    }

    const acceptCall = async () => {
        const { incomingCall } = useRoomStore.getState()
        if (!incomingCall) return
        const stream = await getLocalStream()
        const call = client.call(incomingCall.from, stream)
        call.on('stream', (remoteStream) => {
            useRoomStore.getState().addRemoteStream(incomingCall.from, remoteStream)
            useRoomStore.getState().setActiveCall(incomingCall.roomId, [client.id, incomingCall.from])
        })
        useRoomStore.getState().clearIncomingCall()
    }

    const hangUp = () => {
        localStream?.getTracks().forEach((t) => t.stop())
        localStream = null

        const { activeCall } = useRoomStore.getState()
        if (!activeCall) return

            ; (roomConns.get(activeCall.roomId) ?? [])
                .filter((c) => c.open)
                .forEach((c) => c.send({ type: 'call-declined', payload: { from: client.id } }))

        useRoomStore.getState().clearActiveCall()
        useRoomStore.getState().remoteStreams.forEach((_, peerId) => {
            useRoomStore.getState().remoteStreams.delete(peerId)
        })
    }
    const declineCall = () => {
        const { incomingCall, clearIncomingCall } = useRoomStore.getState()
        if (!incomingCall) return
            ; (roomConns.get(incomingCall.roomId) ?? [])
                .filter((c) => c.open)
                .forEach((c) => c.send({ type: 'call-declined', payload: { from: client.id } }))
        clearIncomingCall()
    }

    const joinRoom = (roomId: string) => {
        if (useRoomStore.getState().rooms.find(({ id }) => id === roomId)) return;

        const room = client.connect(roomId);

        roomConns.set(roomId, [...(roomConns.get(roomId) ?? []), room]);
        room.on('data', (p) => onPacket(p as Packet, roomId, room, false));

        room.on('open', () => {
            const { username } = useUserStore.getState()
            room.send({ type: 'join', payload: { userId: client.id, username } })

            useRoomStore.getState().addRoom({ id: roomId, name: 'Loading..', isHosting: false })
            room.send({ type: 'history-request', payload: { roomId } })
        });

        room.on('close', () => {
            roomConns.set(roomId, (roomConns.get(roomId) ?? []).filter((c) => c !== room))
            if ((roomConns.get(roomId) ?? []).length === 0) {
                useRoomStore.getState().removeRoom(roomId)
            }
        });
    }

    const hostRoom = (roomName: string) => {
        const room = new Peer(crypto.randomUUID())

        room.on('open', () => {
            const { username } = useUserStore.getState()
            hostedPeers.set(room.id, room)
            roomConns.set(room.id, [])
            useRoomStore.getState().addRoom({ id: room.id, name: roomName, isHosting: true })
            useRoomStore.getState().addMember(room.id, { userId: client.id, username: username! })
        });

        room.on('connection', (conn) => {
            const roomId = room.id

            roomConns.set(roomId, [...(roomConns.get(roomId) ?? []), conn])
            conn.on('data', (p) => onPacket(p as Packet, roomId, conn, true))

            conn.on('close', () => {
                const userId = connUsers.get(conn) // ← conn, pas room
                if (userId) {
                    useRoomStore.getState().removeMember(roomId, userId)
                    connUsers.delete(conn)
                    relay({ type: 'leave', payload: { userId } }, roomId, conn)
                }
                roomConns.set(roomId, (roomConns.get(roomId) ?? []).filter((c) => c !== conn))
            })

            conn.on('open', () => {
                const currentMembers = useRoomStore.getState().members[room.id] ?? [];
                conn.send({ type: 'room-info', payload: { name: roomName, members: currentMembers } });
            });
        })
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
        roomHistory.set(activeRoomId, [...(roomHistory.get(activeRoomId) ?? []), msg]);

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
        <RoomContext.Provider value={{ joinRoom, hostRoom, sendMessage, emitTyping, startCall, acceptCall, declineCall, hangUp }}>
            {children}
        </RoomContext.Provider>
    )
}

export const useRoom = () => {
    const ctx = useContext(RoomContext)
    if (!ctx) throw new Error('useRoom must be used within a RoomProvider')
    return ctx
}