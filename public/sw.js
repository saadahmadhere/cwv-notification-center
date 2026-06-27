function openDB() {
	const request = indexedDB.open('notifsDB', 1);

	request.onupgradeneeded = (e) => {
		const db = e.target.result;
		db.createObjectStore('notifications', { keyPath: 'id' });
	};

	return new Promise((res, rej) => {
		request.onsuccess = (e) => {
			const db = e.target.result;
			res(db);
		};
		request.onerror = (e) => {
			console.log(e);
			rej(e);
		};
	});
}

async function saveNotifications(notif) {
	try {
		const db = await openDB();
		const rwTrans = db.transaction('notifications', 'readwrite');
		const store = rwTrans.objectStore('notifications');
		const data = store.put(notif);

		return new Promise((res, rej) => {
			data.onsuccess = (e) => res(e.target.result);
			data.onerror = (e) => rej(e.target.result);
		});
	} catch (error) {
		console.log('saving notification failed, ', error);
	}
}

self.addEventListener('install', () => {
	console.log('[SW] installed');
	self.skipWaiting();
});

self.addEventListener('activate', () => {
	console.log('[SW] activated');
	event.waitUntil(self.clients.claim());
});

self.addEventListener('push', async (event) => {
	const data = event.data.json();
	console.log('[SW] push received sd', data);

	event.waitUntil(saveNotifications(data));
});
