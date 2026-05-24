import { useEffect, useRef, useState } from 'react'

import { useRoom } from '../contexts/RoomContext'

import { useRoomStore } from '../stores/roomStore'
import { useChatStore } from '../stores/chatStore'

import MessageInput from './MessageInput'
import { useClient } from '../contexts/ClientContext'
import { getUserColor } from '../utils/colors'

export default function ChatArea() {
    const { client } = useClient();

    const [copied, setCopied] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    const { sendMessage, emitTyping } = useRoom()
    const { messages } = useChatStore()
    const { rooms, activeRoomId, typingByRoom, members } = useRoomStore()

    const activeRoom = rooms.find((r) => r.id === activeRoomId)
    const activeMessages = messages.filter((m) => m.roomId === activeRoomId)
    const activeTyping = (activeRoomId ? typingByRoom[activeRoomId] : null) ?? []
    const activeMembers = (activeRoomId ? (members[activeRoomId] ?? []).filter((m) => m.userId !== client.id) : []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeMessages.length])

    const copyRoomId = async () => {
        if (!activeRoomId) return
        await navigator.clipboard.writeText(activeRoomId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4">
                <div>
                    <div className="font-semibold">{activeRoom?.name ?? '—'}</div>
                    {activeRoom?.isHosting && (
                        <div className="text-xs text-zinc-500">Vous hébergez cette room</div>
                    )}
                </div>
                {activeRoom?.isHosting && (
                    <button
                        onClick={copyRoomId}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 shrink-0"
                    >
                        {copied ? 'Copié !' : 'Partager l\'ID'}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-linear-to-b from-zinc-950 to-zinc-900">
                {activeMessages.length === 0 && (
                    <div className="text-center text-zinc-600 text-sm mt-12">
                        Aucun message pour l'instant
                    </div>
                )}
                {activeMessages.map((msg) => {
                    const isMine = msg.userId === client.id;
                    const color = getUserColor(msg.userId);

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                        >
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-md transition-all ${isMine
                                    ? 'bg-violet-600 text-white rounded-br-md'
                                    : 'bg-zinc-900 border border-zinc-800 rounded-bl-md'
                                }`}>
                                {!isMine && (
                                    <div className={`text-xs mb-1 ${color.text}`}>
                                        {msg.username}
                                    </div>
                                )}
                                <div>{msg.content}</div>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {activeMembers.length > 0 && (
                <div className='flex gap-2 text-xs py-2 px-3 bg-zinc-900'>
                    {activeMembers.map((m) => {
                        const color = getUserColor(m.userId);
                        return (
                            <span key={m.userId} className={`border-2 ${color.border} ${color.text} ${color.bg} rounded-lg px-2 py-1`}>
                                {m.username}
                            </span>
                        )
                    })}
                </div>
            )}

            {activeTyping.length > 0 && (
                <div className="px-4 pb-2 text-sm text-zinc-400 flex items-center gap-2 bg-linear-to-b from-zinc-900 to-transparent">
                    <div className="flex gap-1">
                        {[0, 100, 200].map((delay) => (
                            <div
                                key={delay}
                                className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </div>
                    <span>{activeTyping.length > 3 ? "Plusieurs personne sont en train d'écrire" : activeTyping.join(', ')} en train d'écrire…</span>
                </div>
            )}

            {activeRoomId && <MessageInput onSend={sendMessage} onTyping={emitTyping} />}
        </div>
    )
}