import { useState } from 'react'

import { useClient } from '../contexts/ClientContext'
import { useRoom } from '../contexts/RoomContext'

import { useUserStore } from '../stores/userStore'
import { useRoomStore } from '../stores/roomStore'

import Modal from './Modal'

export default function Sidebar() {
    const [modal, setModal] = useState<'create' | 'join' | 'err' | null>(null)
    const [newRoomName, setNewRoomName] = useState('')
    const [joinId, setJoinId] = useState('')

    const { client } = useClient()
    const { hostRoom, joinRoom } = useRoom()
    const { username } = useUserStore()
    const { rooms, activeRoomId, setActiveRoom } = useRoomStore()

    const handleCreateRoom = () => {
        if (!newRoomName.trim()) return
        hostRoom(newRoomName.trim())
        setNewRoomName(''); setModal(null)
    }

    const handleJoinRoom = () => {
        if (!joinId.trim()) return
        try {
            joinRoom(joinId.trim())
            setJoinId(''); setModal(null)
        } catch {
            setModal('err')
        }
    }

    return (
        <>
            <div className="w-60 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800">
                    <div className="text-sm font-semibold">{username}</div>
                    <div className="text-xs text-zinc-500 truncate">ID: {client.id}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <div className="text-xs text-zinc-500 uppercase font-semibold px-2 py-2 tracking-wider">
                        Rooms
                    </div>
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setActiveRoom(room.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm ${room.id === activeRoomId
                                ? 'bg-violet-600/20 text-violet-300'
                                : 'text-zinc-300 hover:bg-zinc-800'
                                }`}
                        >
                            <span className="flex-1 truncate">{room.name}</span>
                            {room.isHosting && (
                                <span className="text-[10px] bg-violet-600/30 text-violet-400 px-1.5 py-0.5 rounded-full shrink-0">
                                    host
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-3 border-t border-zinc-800 space-y-2">
                    <button
                        onClick={() => setModal('create')}
                        className="w-full text-sm bg-violet-600 hover:bg-violet-500 py-2 rounded-xl"
                    >
                        + Créer une room
                    </button>
                    <button
                        onClick={() => setModal('join')}
                        className="w-full text-sm bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl text-zinc-300"
                    >
                        Rejoindre par ID
                    </button>
                </div>
            </div>

            {modal === 'err' && (
                <Modal title="Erreur" onClose={() => setModal(null)}>
                    <p className="mb-4 text-zinc-400 text-sm">Cette room n'existe pas.</p>
                    <button onClick={() => setModal(null)} className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl">
                        Ok
                    </button>
                </Modal>
            )}

            {modal === 'create' && (
                <Modal title="Créer une room" onClose={() => setModal(null)}>
                    <input
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                        placeholder="Nom de la room"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-4 outline-none"
                        autoFocus
                    />
                    <button onClick={handleCreateRoom} className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl">
                        Créer
                    </button>
                </Modal>
            )}

            {modal === 'join' && (
                <Modal title="Rejoindre une room" onClose={() => setModal(null)}>
                    <input
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                        placeholder="ID de la room"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-4 outline-none"
                        autoFocus
                    />
                    <button onClick={handleJoinRoom} className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl">
                        Rejoindre
                    </button>
                </Modal>
            )}
        </>
    )
}