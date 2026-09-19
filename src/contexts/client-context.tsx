import { createContext, useContext } from 'react'
import Peer from 'peerjs'

interface ClientContextValue {
    client: Peer;
}

export const ClientContext = createContext<ClientContextValue | null>(null);

export const useClient = () => {
    const ctx = useContext(ClientContext);

    if (!ctx) {
        throw new Error('useClient must be used within a ClientProvider');
    }

    return ctx;
}