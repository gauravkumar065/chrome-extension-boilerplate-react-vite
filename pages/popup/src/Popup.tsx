import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { ToggleButton } from '@extension/ui';
import { Login } from './signin';
import { useState, useEffect } from 'react';
import { ProtectedContent } from './protected';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status when component mounts
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, response => {
      if (response && response.success) {
        setIsAuthenticated(response.isLoggedIn);
        if (response.user) {
          setUserData(response.user);
        }
      }
      setIsLoading(false);
    });
  }, []);

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
    setIsLoading(true);
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, response => {
      if (response && response.success) {
        setIsAuthenticated(response.isLoggedIn);
        if (response.user) {
          setUserData(response.user);
        }
      }
      setIsLoading(false);
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
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : !isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <ProtectedContent userData={userData} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
