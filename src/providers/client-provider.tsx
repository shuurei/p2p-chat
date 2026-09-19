import { ClientContext } from '@/contexts/client-context'
import Peer from 'peerjs'

const client = new Peer();

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <ClientContext.Provider value={{ client }} >
            {children}
        </ClientContext.Provider>
    )
}