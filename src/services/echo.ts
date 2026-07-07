import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from './api';

// Setup Pusher on window object (required by laravel-echo)
(window as any).Pusher = Pusher;

// Environment variables for Reverb
const REVERB_APP_KEY = 'reverb_key';
const REVERB_HOST = 'localhost';
const REVERB_PORT = 8080;

const echo = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: any, options: any) => {
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
});

export default echo;
