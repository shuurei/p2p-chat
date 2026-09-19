import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { FaArrowLeft } from 'react-icons/fa'

import { useClient } from '@/contexts/client-context'
import { useRoom } from '@/contexts/room-context'

import { useChatStore } from '@/stores/useChatStore'
import { useRoomStore } from '@/stores/useRoomStore'

import MessageInput from '@/components/MessageInput'

import { getUserColor } from '@/utils/colors'

export default function TextChannelPage() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    const { client } = useClient()
    const { sendMessage, emitTyping } = useRoom()

    const [copied, setCopied] = useState(false)

    const bottomRef = useRef<HTMLDivElement>(null)

    const { messages } = useChatStore()

    const {
        rooms,
        typingByRoom,
        members,
    } = useRoomStore()

    const activeRoom = rooms.find(
        (room) => room.id === roomId,
    )

    const activeMessages = messages.filter(
        (message) => message.roomId === roomId,
    )

    const activeTyping = roomId
        ? typingByRoom[roomId] ?? []
        : []

    const activeMembers = roomId
        ? (members[roomId] ?? []).filter(
            (member) => member.userId !== client.id,
        )
        : []

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
        })
    }, [activeMessages.length])

    const copyRoomId = async () => {
        if (!roomId) return

        await navigator.clipboard.writeText(roomId)

        setCopied(true)

        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }

    return (
        <div className='h-full flex flex-col min-w-0'>
            <header className="shrink-0 min-h-14 px-3 sm:px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="md:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                    aria-label="Retour aux channels"
                >
                    <FaArrowLeft />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">
                        {activeRoom?.name ?? '—'}
                    </div>

                    {activeRoom?.isHosting && (
                        <div className="text-xs text-zinc-500 truncate">
                            Vous hébergez cette room
                        </div>
                    )}
                </div>

                {activeRoom?.isHosting && (
                    <button
                        type="button"
                        onClick={copyRoomId}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-zinc-300 shrink-0 transition-colors"
                    >
                        {copied ? 'Copié !' : 'Partager l’ID'}
                    </button>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-2 bg-linear-to-b from-zinc-950 to-zinc-900">
                {activeMessages.length === 0 && (
                    <div className="text-center text-zinc-600 text-sm mt-12">
                        Aucun message pour l'instant
                    </div>
                )}

                {activeMessages.map((msg) => {
                    const isMine =
                        msg.userId === client.id

                    const color =
                        getUserColor(msg.userId)

                    return (
                        <div
                            key={msg.id}
                            className={`
                                flex
                                ${isMine
                                    ? 'justify-end'
                                    : 'justify-start'
                                }
                                animate-in
                                fade-in
                                slide-in-from-bottom-2
                            `}
                        >
                            <div
                                className={`
                                    max-w-[85%]
                                    sm:max-w-[70%]
                                    px-4 py-2
                                    rounded-2xl
                                    text-sm
                                    shadow-md
                                    transition-all
                                    break-words
                                    overflow-wrap-anywhere

                                    ${isMine
                                        ? 'bg-violet-600 text-white rounded-br-md'
                                        : 'bg-zinc-900 border border-zinc-800 rounded-bl-md'
                                    }
                                `}
                            >
                                {!isMine && (
                                    <div
                                        className={`
                                            text-xs
                                            mb-1
                                            ${color.text}
                                        `}
                                    >
                                        {msg.username}
                                    </div>
                                )}

                                <div>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    )
                })}

                <div ref={bottomRef} />
            </div>

            {/* Members */}
            {activeMembers.length > 0 && (
                <div className="shrink-0 flex gap-2 overflow-x-auto text-xs py-2 px-3 bg-zinc-900 border-t border-zinc-800">
                    {activeMembers.map((member) => {
                        const color =
                            getUserColor(member.userId)

                        return (
                            <span
                                key={member.userId}
                                className={`
                                    border-2
                                    ${color.border}
                                    ${color.text}
                                    ${color.bg}
                                    rounded-lg
                                    px-2 py-1
                                    whitespace-nowrap
                                    shrink-0
                                `}
                            >
                                {member.username}
                            </span>
                        )
                    })}
                </div>
            )}

            {/* Typing */}
            {activeTyping.length > 0 && (
                <div className="shrink-0 px-4 pb-2 pt-1 text-sm text-zinc-400 flex items-center gap-2 bg-zinc-900">
                    <div className="flex gap-1">
                        {[0, 100, 200].map((delay) => (
                            <div
                                key={delay}
                                className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                                style={{
                                    animationDelay: `${delay}ms`,
                                }}
                            />
                        ))}
                    </div>

                    <span className="truncate">
                        {activeTyping.length > 3
                            ? 'Plusieurs personnes sont en train d’écrire'
                            : `${activeTyping.join(', ')} en train d’écrire…`}
                    </span>
                </div>
            )}

            {/* Input */}
            <div className="shrink-0">
                <MessageInput
                    onSend={(content) =>
                        roomId &&
                        sendMessage(roomId, content)
                    }
                    onTyping={() =>
                        roomId &&
                        emitTyping(roomId)
                    }
                />
            </div>
        </div>
    )
}