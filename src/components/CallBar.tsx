import { useRoomStore } from '../stores/roomStore'
import { useRoom } from '../contexts/RoomContext'
import { getUserColor } from '../utils/colors'

export default function CallBar() {
    const { activeCall, members, rooms } = useRoomStore()
    const { hangUp } = useRoom()

    if (!activeCall) return null

    const roomMembers = members[activeCall.roomId] ?? []
    const activeRoom = rooms.find((r) => r.id === activeCall.roomId)
    const callParticipants = roomMembers.filter((m) => activeCall.peers.includes(m.userId))

    return (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-xl z-50">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-zinc-400">{activeRoom?.name}</span>
            </div>

            <div className="flex items-center gap-1">
                {callParticipants.map((m) => {
                    const color = getUserColor(m.userId)
                    return (
                        <span key={m.userId} className={`text-xs px-2 py-0.5 rounded-full ${color.text} ${color.bg}`}>
                            {m.username}
                        </span>
                    )
                })}
            </div>

            <button
                onClick={hangUp}
                className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs"
            >
                Raccrocher
            </button>
        </div>
    )
}