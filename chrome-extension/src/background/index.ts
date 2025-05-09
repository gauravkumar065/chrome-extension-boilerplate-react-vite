import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async tab => {
  // Check if we can inject scripts into this tab
  if (
    !tab.id ||
    !tab.url ||
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('edge://') ||
    tab.url.startsWith('about:')
  ) {
    console.log('Cannot inject into this page');
    return;
  }

  try {
    // First, make sure the content script is injected
    await ensureContentScriptInjected(tab.id);

    // Then send the toggle message
    chrome.tabs.sendMessage(tab.id, { action: 'togglePopup' }).catch(error => {
      console.log('Error sending message:', error);
    });
  } catch (error) {
    console.log('Error in action click handler:', error);
  }
});

// Function to ensure content script is injected
async function ensureContentScriptInjected(tabId: number) {
  try {
    // Check if our content script is already running by sending a ping
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => null);

    // If we got a response, the content script is already running
    if (response === 'pong') {
      return;
    }

    // If no response, inject the content script
    console.log('Injecting content script');
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/index.iife.js'],
    });

    // Wait a bit for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error('Error ensuring content script injection:', error);
    throw error;
  }
}

// Background script to handle authentication state
const API_URL = 'http://20.119.41.172:4000'; // Use the same API URL as the old version

// Define interfaces for type safety
interface SignInMessage {
  action: string;
  data: {
    email: string;
    password: string;
  };
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  user?: {
    email: string;
    name: string;
    role: string;
  } | null;
  isLoggedIn?: boolean;
}

interface CheckAuthResponse {
  isLoggedIn: boolean;
  user: {
    email: string;
    name: string;
    role: string;
  } | null;
  success: boolean;
}

chrome.runtime.onInstalled.addListener(() => {
  // Initialize the auth state
  chrome.storage.local.get(['token'], result => {
    const isLoggedIn = !!result.token;
    console.log('Authentication state initialized:', isLoggedIn ? 'Logged in' : 'Not logged in');
  });
});

// Verify token validity on extension startup
chrome.runtime.onStartup.addListener(async () => {
  await verifyToken();
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: SignInMessage | { type: string }, sender, sendResponse) => {
  if ('action' in message && message.action === 'signIn') {
    signIn(message as SignInMessage, sender.tab?.id, sendResponse);
    return true; // Keep the message channel open for async response
  }

  if ('type' in message && message.type === 'LOGOUT') {
    chrome.storage.local.remove(['token', 'email', 'name', 'role'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if ('type' in message && message.type === 'CHECK_AUTH') {
    checkAuth(sendResponse);
    return true;
  }
});

// Sign in function based on the old version
const signIn = async (
  message: SignInMessage,
  tabId: number | undefined,
  sendResponse: (response: AuthResponse) => void,
) => {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message.data),
    });

    const response = await res.json();
    if (response.status === 'success') {
      // Store authentication data
      await chrome.storage.local.set({ token: response.data.token });
      await chrome.storage.local.set({ email: response.data.email });
      await chrome.storage.local.set({ name: response.data.name });
      await chrome.storage.local.set({ role: response.data.role });

      // Send success response
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'signInResponse',
          status: 'success',
          data: response.data,
          message: '',
        });
      }

      if (sendResponse) {
        sendResponse({
          success: true,
          data: response.data,
        });
      }
    } else {
      // Send error response
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'signInResponse',
          status: 'error',
          message: response.message,
        });
      }

      if (sendResponse) {
        sendResponse({
          success: false,
          message: response.message,
        });
      }
    }
  } catch (error) {
    console.error('Error in signing in', error);
    const errorMsg = 'Uncaught error. Please try again';

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'signInResponse',
        status: 'error',
        message: errorMsg,
      });
    }

    if (sendResponse) {
      sendResponse({
        success: false,
        message: errorMsg,
      });
    }
  }
};

// Check token validity
const verifyToken = async () => {
  try {
    const data = await chrome.storage.local.get(['token']);
    const token = data.token;

    if (!token) return false;

    const res = await fetch(`${API_URL}/api/v1/auth/verifytoken`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await res.json();
    if (response.status === 'success') {
      await chrome.storage.local.set({ email: response.user.email });
      await chrome.storage.local.set({ name: response.user.name });
      return true;
    } else {
      await chrome.storage.local.remove(['token', 'email', 'name', 'role']);
      return false;
    }
  } catch (error) {
    console.error('Error verifying token', error);
    await chrome.storage.local.remove(['token', 'email', 'name', 'role']);
    return false;
  }
};

// Check authentication status for the popup
const checkAuth = async (sendResponse: (response: CheckAuthResponse) => void) => {
  try {
    const isTokenValid = await verifyToken();
    if (isTokenValid) {
      const data = await chrome.storage.local.get(['email', 'name', 'role']);
      sendResponse({
        isLoggedIn: true,
        success: true,
        user: {
          email: data.email,
          name: data.name,
          role: data.role,
        },
      });
    } else {
      sendResponse({
        isLoggedIn: false,
        success: true,
        user: null,
      });
    }
  } catch (error) {
    console.error('Error checking auth', error);
    sendResponse({
      isLoggedIn: false,
      success: false,
      user: null,
    });
  }
};

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
