import { useState } from 'react'

interface MessageInputProps {
    onSend: (v: string) => void;
    onTyping: () => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
    const [value, setValue] = useState('');

    return (
        <form
            className="p-4 border-t border-zinc-800 flex gap-2"
            onSubmit={(e) => {
                e.preventDefault()
                if (!value.trim()) return
                onSend(value)
                setValue('')
            }}
        >
            <input
                value={value}
                onChange={(e) => { setValue(e.target.value); onTyping() }}
                placeholder="Message..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 outline-none"
            />
            <button type="submit" className="bg-violet-600 px-4 rounded-xl">
                Send
            </button>
        </form>
    )
}