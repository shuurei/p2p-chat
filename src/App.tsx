import { useUserStore } from './stores/userStore'

import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { useRoomStore } from './stores/roomStore'

export default function App() {
    const { username } = useUserStore()
    const { activeRoomId } = useRoomStore();

    if (!username) return <LoginScreen />

    return (
        <div className="h-screen bg-zinc-950 text-white flex overflow-hidden">
            <Sidebar />
            {activeRoomId ? <ChatArea /> : <p>Nop</p>}
        </div>
    )
}