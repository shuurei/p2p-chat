import React, { useState } from 'react'
import type { ClassValue } from 'clsx'

import { useNavigate, useParams } from 'react-router'

import { useClient } from '../contexts/client-context'
import { useRoom } from '../contexts/room-context'

import { useUserStore } from '../stores/useUserStore'
import { useRoomStore } from '../stores/useRoomStore'

import Modal from './Modal'
import { cn } from '@/utils/cn'

type SidebarProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> & {
    className: ClassValue;
}

export default function Sidebar({ className }: SidebarProps) {
    const navigate = useNavigate();
    const { roomId } = useParams();

    const [modal, setModal] = useState<'create' | 'join' | 'err' | null>(null);

    const [newRoomName, setNewRoomName] = useState('');
    const [joinId, setJoinId] = useState('');

    const { client } = useClient();
    const { hostRoom, joinRoom } = useRoom();

    const { username } = useUserStore();
    const { rooms } = useRoomStore();

    const handleCreateRoom = () => {
        if (!newRoomName.trim()) return

        hostRoom(newRoomName.trim());

        setNewRoomName('');
        setModal(null);
    }

    const handleJoinRoom = () => {
        if (!joinId.trim()) return

        try {
            joinRoom(joinId.trim());

            setJoinId('');
            setModal(null);
        } catch {
            setModal('err');
        }
    }

    return (
        <>
            <aside
                className={cn(
                    'h-full w-full md:w-60 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col',
                    className
                )}
            >
                {/* User */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="text-sm font-semibold">
                        {username}
                    </div>

                    <div className="text-xs text-zinc-500 truncate">
                        ID: {client.id}
                    </div>
                </div>

                {/* Rooms */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2">
                    <div className="text-xs text-zinc-500 uppercase font-semibold px-2 py-2 tracking-wider">
                        Rooms
                    </div>

                    <div className="space-y-1">
                        {rooms.map((room) => (
                            <button
                                key={room.id}
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/channels/${room.id}`,
                                    )
                                }
                                className={`
                                    w-full
                                    text-left
                                    px-3 py-2.5
                                    rounded-xl
                                    flex items-center gap-2
                                    transition-colors
                                    text-sm

                                    ${
                                        room.id === roomId
                                            ? 'bg-violet-600/20 text-violet-300'
                                            : 'text-zinc-300 hover:bg-zinc-800'
                                    }
                                `}
                            >
                                <span className="flex-1 truncate">
                                    {room.name}
                                </span>

                                {room.isHosting && (
                                    <span className="text-[10px] bg-violet-600/30 text-violet-400 px-1.5 py-0.5 rounded-full shrink-0">
                                        host
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-zinc-800 space-y-2">
                    <button
                        type="button"
                        onClick={() => setModal('create')}
                        className="w-full text-sm bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl transition-colors"
                    >
                        + Créer une room
                    </button>

                    <button
                        type="button"
                        onClick={() => setModal('join')}
                        className="w-full text-sm bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-xl text-zinc-300 transition-colors"
                    >
                        Rejoindre par ID
                    </button>
                </div>

                {/* VERSION */}
                <div className='flex items-center justify-center text-xs text-white/80 pb-2'>
                    <p>{__BUILD_VERSION__} ({__BUILD_NUMBER__})</p>
                </div>
            </aside>

            {/* Error */}
            {modal === 'err' && (
                <Modal
                    title="Erreur"
                    onClose={() => setModal(null)}
                >
                    <p className="mb-4 text-zinc-400 text-sm">
                        Cette room n'existe pas.
                    </p>

                    <button
                        type="button"
                        onClick={() => setModal(null)}
                        className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl"
                    >
                        Ok
                    </button>
                </Modal>
            )}

            {/* Create */}
            {modal === 'create' && (
                <Modal
                    title="Créer une room"
                    onClose={() => setModal(null)}
                >
                    <input
                        value={newRoomName}
                        onChange={(e) =>
                            setNewRoomName(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateRoom()
                            }
                        }}
                        placeholder="Nom de la room"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-4 outline-none"
                        autoFocus
                    />

                    <button
                        type="button"
                        onClick={handleCreateRoom}
                        className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl"
                    >
                        Créer
                    </button>
                </Modal>
            )}

            {/* Join */}
            {modal === 'join' && (
                <Modal
                    title="Rejoindre une room"
                    onClose={() => setModal(null)}
                >
                    <input
                        value={joinId}
                        onChange={(e) =>
                            setJoinId(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleJoinRoom()
                            }
                        }}
                        placeholder="ID de la room"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-4 outline-none"
                        autoFocus
                    />

                    <button
                        type="button"
                        onClick={handleJoinRoom}
                        className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl"
                    >
                        Rejoindre
                    </button>
                </Modal>
            )}
        </>
    );
}