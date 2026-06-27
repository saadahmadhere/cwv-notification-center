import { useState, useEffect } from 'react';
import './App.css';

function App() {
	const [list, setList] = useState([]);

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

	useEffect(() => {
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
	}, []);

	function handleNotificationClick(id) {
		setList((prev) =>
			prev.map((not) => (not.id === id ? { ...not, isRead: true } : not)),
		);
	}

	return (
		<div className='App'>
			<h3>Notifications</h3>
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
