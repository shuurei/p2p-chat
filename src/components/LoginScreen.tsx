import { useState } from 'react'
import { useUserStore } from '../stores/userStore'

export default function LoginScreen() {
    const [usernameInput, setUsernameInput] = useState('')
    const { setUsername } = useUserStore()

    const handleSubmit = () => {
        if (!usernameInput.trim()) return
        setUsername(usernameInput)
    }

    return (
        <div className="h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <h1 className="text-xl font-bold mb-6">P2P Chat</h1>
                <input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                    placeholder="Pseudo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-4 outline-none"
                />
                <button
                    onClick={handleSubmit}
                    className="w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl"
                >
                    Continuer
                </button>
            </div>
        </div>
    )
}