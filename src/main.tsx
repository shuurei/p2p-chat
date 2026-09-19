import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import './index.css'

import { ClientProvider } from './providers/client-provider'
import { RoomProvider } from './providers/room-provider'

import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'

import TextChannelPage from './pages/TextChannelPage'

const router = createBrowserRouter([
	{
		path: '/auth/login',
		element: <AuthLayout />
	},
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{
				path: '/channels/:roomId',
				element: <TextChannelPage />
			}
		]
	}
], { basename: '/p2p-chat' });

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ClientProvider>
			<RoomProvider>
				<RouterProvider router={router} />
			</RoomProvider>
		</ClientProvider>
	</StrictMode>
);
