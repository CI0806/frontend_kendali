export const ROLE_ADMIN = 'admin';

export const DRAG_CARD = 'drag_card';

export const DRAG_LIST = 'drag_list';

export const SESSION_KEY = 'my-session';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const url = isLocalhost ? 'http://localhost:3000' : 'https://api.pkmkarjotarakan.com';