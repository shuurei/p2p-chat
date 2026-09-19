import { Navigate, Outlet, useParams } from 'react-router'

import { useUserStore } from '@/stores/useUserStore'

import Sidebar from '@/components/Sidebar'

export default function AppLayout() {
    const username = useUserStore((state) => state.username)
    const { roomId } = useParams();

    if (!username) {
        return <Navigate to="/auth/login" replace />
    }

    return (
        <div className='h-full flex overflow-hidden'>
           <Sidebar className={{ 'max-md:hidden': roomId }} />

            <main className='h-full min-w-0 flex-1'>
                <Outlet />
            </main>
        </div>
    );
}