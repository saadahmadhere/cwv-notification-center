import { useState, useEffect } from 'react';
import './App.css';

function App() {
	const [list, setList] = useState([]);
	const [isOnline, setIsOnline] = useState(navigator.onLine);

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

	async function getAllNotifications() {
		try {
			const db = await openDB();
			const transaction = db.transaction('notifications', 'readonly');
			const store = transaction.objectStore('notifications');
			const data = store.getAll();
			return new Promise((res, rej) => {
				data.onsuccess = (e) => {
					res(e.target.result);
				};
				data.onerror = (e) => {
					rej(e.target.result);
				};
			});
		} catch (error) {
			console.log(error);
		}
	}

	async function updateNotifications(notif) {
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

	useEffect(() => {
		const handleIsOnline = () => setIsOnline(true);
		const handleIsOffline = () => setIsOnline(false);

		window.addEventListener('online', handleIsOnline);
		window.addEventListener('offline', handleIsOffline);
		const channel = new BroadcastChannel('notifs-channel');
		channel.onmessage = async () => {
			const notifications = await getAllNotifications();
			setList(notifications);
		};
		(async () => {
			try {
				if ('serviceWorker' in navigator) {
					navigator.serviceWorker.register('/sw.js');
				}
				const notifications = await getAllNotifications();
				setList(notifications);
			} catch (error) {
				console.log('error from useEffect', error);
			}
		})();

		return () => {
			window.removeEventListener('online', handleIsOnline);
			window.removeEventListener('offline', handleIsOffline);
			channel.close();
		};
	}, []);

	async function handleNotificationClick(id) {
		const notif = list.find((li) => li.id === id);
		const newNotif = { ...notif, isRead: true };

		await updateNotifications(newNotif);

		setList((prev) => {
			return prev.map((not) =>
				not.id === id ? { ...not, isRead: true } : not,
			);
		});
	}

	return (
		<div className='App'>
			<h3>Notifications</h3>
			{!isOnline ? <h4>you're offline</h4> : <h4>you're online</h4>}
			{list.map((not) => {
				return (
					<div
						key={not.id}
						className={`list-item ${not.isRead ? 'read' : ''}`}
						onClick={function () {
							return handleNotificationClick(not.id);
						}}
					>
						{not.name}
					</div>
				);
			})}
		</div>
	);
}

export default App;
