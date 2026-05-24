import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { UserProvider } from './contexts/ClientContext.tsx'
import { RoomProvider } from './contexts/RoomContext.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<UserProvider>
			<RoomProvider>
				<App />
			</RoomProvider>
		</UserProvider>
	</StrictMode>
);
