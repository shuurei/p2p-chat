import Peer, { type DataConnection } from 'peerjs'

import { useChatStore } from '../stores/useChatStore'
import { useRoomStore, type Member } from '../stores/useRoomStore'
import { useUserStore } from '../stores/useUserStore'
import { useClient } from '@/contexts/client-context'
import { RoomContext } from '@/contexts/room-context'

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
    | { type: 'room-info'; payload: { name: string; members: Member[] } }
    | { type: 'join'; payload: { userId: string; username: string } }
    | { type: 'leave'; payload: { userId: string } }

const connUsers = new Map<DataConnection, string>();
const hostedPeers = new Map<string, Peer>();
const roomConns = new Map<string, DataConnection[]>();
const roomHistory = new Map<string, Message[]>();
const seenMessages = new Set<string>();
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

let typingCooldown: ReturnType<typeof setTimeout> | null = null;

const safeAdd = (msg: Message) => {
    if (seenMessages.has(msg.id)) return

    seenMessages.add(msg.id)
    useChatStore.getState().addMessage(msg)
}

const relay = (packet: Packet, roomId: string, exclude: DataConnection | null) => {
    (roomConns.get(roomId) ?? [])
        .filter((c) => c !== exclude && c.open)
        .forEach((c) => c.send(packet));
}

const onPacket = (packet: Packet, roomId: string, from: DataConnection | null, isHost: boolean) => {
    const { setTyping, removeTyping } = useRoomStore.getState();

    switch (packet.type) {
        case 'message': {
            const msg = { ...packet.payload, roomId }

            safeAdd(msg);

            roomHistory.set(roomId, [...(roomHistory.get(roomId) ?? []), msg]);

            if (isHost) {
                relay(packet, roomId, from);
            }
            
            break;
        }

        case 'typing': {
            setTyping(roomId, packet.payload.username);

            const key = `${roomId}:${packet.payload.username}`

            clearTimeout(typingTimers.get(key));
            typingTimers.set(key, setTimeout(() => { removeTyping(roomId, packet.payload.username) }, 1200));

            if (isHost) {
                relay(packet, roomId, from)
            }

            break;
        }

        case 'history-request': {
            return from?.send({
                type: 'history',
                payload: {
                    roomId,
                    messages: roomHistory.get(roomId) ?? []
                }
            });
        }

        case 'history': {
            return packet.payload.messages.forEach(safeAdd);
        }

        case 'join': {
            connUsers.set(from!, packet.payload.userId);

            useRoomStore
                .getState()
                .addMember(roomId, packet.payload);

            if (isHost) {
                relay(packet, roomId, from);
            }

            break;
        }

        case 'leave': {
            useRoomStore
                .getState()
                .removeMember(roomId, packet.payload.userId);

            if (isHost) {
                relay(packet, roomId, from);
            }

            break;
        }

        case 'room-info': {
            const { updateRoom, addMember } = useRoomStore.getState();

            updateRoom(roomId, { name: packet.payload.name });

            return packet.payload.members.forEach((member) => addMember(roomId, member))
        }
    }
}

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
    const { client } = useClient();

    const joinRoom = (roomId: string) => {
        if (
            useRoomStore
                .getState()
                .rooms
                .find(({ id }) => id === roomId)
        ) return

        const room = client.connect(roomId);
        roomConns.set(roomId, [ ...(roomConns.get(roomId) ?? []), room ]);

        room.on('data', (packet) => onPacket(packet as Packet, roomId, room, false));

        room.on('open', () => {
            const { username } = useUserStore.getState();

            room.send({
                type: 'join',
                payload: {
                    userId: client.id,
                    username,
                }
            });

            useRoomStore
                .getState()
                .addRoom({
                    id: roomId,
                    name: 'Loading..',
                    isHosting: false,
                });

            room.send({
                type: 'history-request',
                payload: { roomId }
            });
        })

        room.on('close', () => {
            roomConns.set(roomId, (roomConns.get(roomId) ?? []).filter((connection) => connection !== room));

            if ((roomConns.get(roomId) ?? []).length === 0) {
                useRoomStore
                    .getState()
                    .removeRoom(roomId)
            }
        })
    }

    const hostRoom = (roomName: string) => {
        const room = new Peer(crypto.randomUUID());

        room.on('open', () => {
            const { username } = useUserStore.getState();

            hostedPeers.set(room.id, room);
            roomConns.set(room.id, []);

            useRoomStore
                .getState()
                .addRoom({
                    id: room.id,
                    name: roomName,
                    isHosting: true,
                });

            useRoomStore
                .getState()
                .addMember(room.id, { userId: client.id, username: username! })
        });

        room.on('connection', (conn) => {
            const roomId = room.id

            roomConns.set(roomId, [ ...(roomConns.get(roomId) ?? []), conn ]);
            conn.on('data', (packet) => onPacket(packet as Packet, roomId, conn, true));

            conn.on('close', () => {
                const userId = connUsers.get(conn);

                if (userId) {
                    useRoomStore
                        .getState()
                        .removeMember(roomId, userId);

                    connUsers.delete(conn);

                    relay({ type: 'leave', payload: { userId, } }, roomId, conn);
                }

                roomConns.set(roomId, (roomConns.get(roomId) ?? []).filter((connection) => connection !== conn));
            });

            conn.on('open', () => {
                const currentMembers = useRoomStore.getState().members[room.id] ?? []

                conn.send({
                    type: 'room-info',
                    payload: {
                        name: roomName,
                        members: currentMembers
                    }
                });
            })
        })
    }

    const sendMessage = (roomId: string, content: string) => {
        const { username } = useUserStore.getState();

        if (!content.trim() || !roomId || !username) {
            return
        }

        const msg: Message = {
            id: crypto.randomUUID(),
            userId: client.id,
            username,
            content,
            roomId
        }

        safeAdd(msg);

        roomHistory.set(roomId, [ ...(roomHistory.get(roomId) ?? []), msg ]);

        (roomConns.get(roomId) ?? [])
            .filter((conn) => conn.open)
            .forEach((conn) => conn.send({ type: 'message', payload: msg }))
    }

    const emitTyping = (roomId: string) => {
        const { username } = useUserStore.getState()

        if (typingCooldown || !roomId) {
            return
        }

        typingCooldown = setTimeout(() => { typingCooldown = null }, 800);

        (roomConns.get(roomId) ?? [])
            .filter((conn) => conn.open)
            .forEach((conn) => {
                conn.send({
                    type: 'typing',
                    payload: { username, roomId }
                })
            });
    }

    return (
        <RoomContext.Provider value={{ joinRoom, hostRoom, sendMessage, emitTyping }}>
            {children}
        </RoomContext.Provider>
    );
}