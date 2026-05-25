import { useRoomStore } from '../stores/roomStore'
import { useRoom } from '../contexts/RoomContext'

export default function CallNotification() {
    const { incomingCall } = useRoomStore()
    const { acceptCall, declineCall } = useRoom()

    if (!incomingCall) return null

    return (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex items-center gap-3 shadow-xl z-50">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">{incomingCall.username} appelle...</span>
            <button
                onClick={acceptCall}
                className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-xs"
            >
                Accepter
            </button>
            <button
                onClick={declineCall}
                className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs"
            >
                Refuser
            </button>
        </div>
    )
}