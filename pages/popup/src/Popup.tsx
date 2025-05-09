import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { ToggleButton } from '@extension/ui';
import { Login } from './signin';
import { useState, useEffect } from 'react';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    // Check authentication status when component mounts
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, response => {
      if (response && response.success) {
        setIsAuthenticated(response.isLoggedIn);
        if (response.user) {
          setUserData(response.user);
        }
      }
    });
  }, []);

  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        // Handling errors related to other paths
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  const handleLoginSuccess = () => {
    // Re-check authentication status
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, response => {
      if (response && response.success) {
        setIsAuthenticated(response.isLoggedIn);
        if (response.user) {
          setUserData(response.user);
        }
      }
    });
  };

  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, response => {
      if (response && response.success) {
        setIsAuthenticated(false);
        setUserData(null);
      }
    });
  };

  return (
    <div className="popup-container">
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <ProtectedContent userData={userData} onLogout={handleLogout} />
      )}
    </div>
  );
};

interface ProtectedContentProps {
  userData: { email: string; name: string; role: string } | null;
  onLogout: () => void;
}

const ProtectedContent = ({ userData, onLogout }: ProtectedContentProps) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Protected Content</h2>
      {userData && (
        <div className="mb-4 text-gray-700">
          <p>
            Welcome <strong>{userData.name}</strong>!
          </p>
          <p className="text-sm">{userData.email}</p>
          <p className="text-xs bg-blue-100 inline-block px-2 py-1 rounded mt-1">Role: {userData.role}</p>
        </div>
      )}

      <div className="bg-blue-100 p-3 rounded mb-4">
        <h3 className="font-semibold mb-2">Your Dashboard</h3>
        <ul className="list-disc pl-5">
          <li>Feature 1</li>
          <li>Feature 2</li>
          <li>Feature 3</li>
        </ul>
      </div>

      <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">
        Logout
      </button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
