import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from './api';

// Setup Pusher on window object (required by laravel-echo)
(window as any).Pusher = Pusher;

const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY;
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST;
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT, 10) : 8080;
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'https';

// Only instantiate Echo if Reverb credentials and host are provided
const echo: Echo<'reverb'> | null = (REVERB_APP_KEY && REVERB_HOST)
    ? new Echo({
        broadcaster: 'reverb',
        key: REVERB_APP_KEY,
        wsHost: REVERB_HOST,
        wsPort: REVERB_PORT,
        wssPort: REVERB_PORT,
        forceTLS: REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel: any) => {
            return {
                authorize: (socketId: any, callback: any) => {
                    const token = localStorage.getItem('cvba_api_token');
                    fetch(`${API_BASE_URL}/broadcasting/auth`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            socket_id: socketId,
                            channel_name: channel.name
                        })
                    })
                    .then(response => {
                        if (response.ok) return response.json();
                        throw new Error('Broadcast Auth Failed');
                    })
                    .then(data => callback(false, data))
                    .catch(error => callback(true, error));
                }
            };
        },
    })
    : null;

export default echo;
