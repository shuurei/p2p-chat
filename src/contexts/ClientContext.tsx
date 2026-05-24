import { createContext, useContext } from 'react'
import Peer from 'peerjs'

interface ClientContextType {
    client: Peer;
}

const client = new Peer();

const ClientContext = createContext<ClientContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <ClientContext.Provider value={{ client }} >
            {children}
        </ClientContext.Provider>
    )
}

export const useClient = () => {
    const ctx = useContext(ClientContext);

    if (!ctx) {
        throw new Error('useClient must be used within a ClientProvider');
    }

    return ctx;
}