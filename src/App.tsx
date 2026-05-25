import { useUserStore } from './stores/userStore'

import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { useRoomStore } from './stores/roomStore'
import CallNotification from './components/CallNotification'
import RemoteAudio from './components/RemoteAudio'
import CallBar from './components/CallBar'

export default function App() {
    const { username } = useUserStore()
    const { activeRoomId, remoteStreams } = useRoomStore();

    if (!username) return <LoginScreen />

    return (
        <div className="h-screen bg-zinc-950 text-white flex overflow-hidden">
            <Sidebar />
            <CallBar />
            {activeRoomId ? <ChatArea /> : <div></div>}
            <CallNotification />
            {[...remoteStreams.entries()].map(([peerId, stream]) => (
                <RemoteAudio key={peerId} stream={stream} />
            ))}
        </div>
    )
}