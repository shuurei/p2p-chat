const COLORS = [
    { text: 'text-violet-400', border: 'border-violet-500', bg: 'bg-violet-500/20' },
    { text: 'text-blue-400',   border: 'border-blue-500',   bg: 'bg-blue-500/20' },
    { text: 'text-green-400',  border: 'border-green-500',  bg: 'bg-green-500/20' },
    { text: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500/20' },
    { text: 'text-pink-400',   border: 'border-pink-500',   bg: 'bg-pink-500/20' },
    { text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500/20' },
    { text: 'text-cyan-400',   border: 'border-cyan-500',   bg: 'bg-cyan-500/20' },
    { text: 'text-rose-400',   border: 'border-rose-500',   bg: 'bg-rose-500/20' }
];

export const getUserColor = (userId: string) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
}