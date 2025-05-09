import { sampleFunction } from '@src/sampleFunction';

console.log('content script loaded');

// Shows how to call a function defined in another module
sampleFunction();

// Inject CSS styles
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #chrome-extension-floating-popup-resize-handle::after {
      content: "";
      position: absolute;
      right: 3px;
      bottom: 3px;
      width: 10px;
      height: 10px;
      border-right: 2px solid rgba(128, 128, 128, 0.7);
      border-bottom: 2px solid rgba(128, 128, 128, 0.7);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// Call the function to inject styles
injectStyles();

// Track popup state
let popupElement: HTMLIFrameElement | null = null;
let isPopupOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Register the content script
chrome.runtime.sendMessage({ action: 'contentScriptReady' }).catch(error => {
  console.log('Error sending ready message:', error);
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle ping messages (used to check if content script is loaded)
  if (message.action === 'ping') {
    sendResponse('pong');
    return true;
  }

  // Handle toggle popup action
  if (message.action === 'togglePopup') {
    if (isPopupOpen) {
      removePopup();
    } else {
      createPopup();
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

function createPopup() {
  if (popupElement) {
    return; // Popup already exists
  }

  // Create container for the popup
  const container = document.createElement('div');
  container.id = 'chrome-extension-floating-popup-container';
  container.style.position = 'fixed';
  container.style.zIndex = '2147483647'; // Max z-index
  container.style.top = '100px';
  container.style.left = '100px';
  container.style.width = '400px';
  container.style.height = '500px';
  container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.25)';
  container.style.borderRadius = '8px';
  container.style.overflow = 'hidden';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.backgroundColor = '#FFFFFF';

  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'chrome-extension-floating-popup-resize-handle';
  resizeHandle.style.position = 'absolute';
  resizeHandle.style.bottom = '0';
  resizeHandle.style.right = '0';
  resizeHandle.style.width = '15px';
  resizeHandle.style.height = '15px';
  resizeHandle.style.cursor = 'nwse-resize';
  resizeHandle.style.background = 'transparent';

  // Create iframe to load the popup content
  const iframe = document.createElement('iframe');
  iframe.id = 'chrome-extension-floating-popup-iframe';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'clipboard-read; clipboard-write';
  iframe.src = chrome.runtime.getURL('popup/index.html');

  // Add a listener to handle navigation between extension pages
  iframe.addEventListener('load', () => {
    try {
      // Add a message listener to handle navigation requests from the iframe
      const handleIframeMessage = (event: MessageEvent) => {
        // Only accept messages from our iframe
        if (iframe.contentWindow !== event.source) return;

        // Handle navigation requests
        if (event.data && event.data.type === 'navigate') {
          if (event.data.url) {
            // If it's an extension URL, load it in the iframe
            if (event.data.url.startsWith('chrome-extension://')) {
              iframe.src = event.data.url;
            } else {
              // For external URLs, open in a new tab
              chrome.tabs.create({ url: event.data.url });
            }
          }
        }

        // Handle drag and close events from the ProtectedContent header
        if (event.data && event.data.type === 'closePopup') {
          removePopup();
        }
      };

      window.addEventListener('message', handleIframeMessage);
    } catch (error) {
      console.error('Error setting up iframe handler:', error);
    }
  });

  // Add elements to the container
  container.appendChild(iframe);
  container.appendChild(resizeHandle);

  // Append container to the body
  document.body.appendChild(container);

  popupElement = iframe;
  isPopupOpen = true;

  // Add event listener for resizing
  resizeHandle.addEventListener('mousedown', startResizing);

  // Set up drag functionality on the whole container for now
  // The actual header in ProtectedContent will be the visual drag handle
  container.addEventListener('mousedown', e => {
    // Only start dragging if the click is on the header area
    // (approximately top 40px of the popup)
    if (e.offsetY < 40) {
      startDragging(e);
    }
  });
}

function removePopup() {
  const container = document.getElementById('chrome-extension-floating-popup-container');
  if (container) {
    document.body.removeChild(container);
  }

  popupElement = null;
  isPopupOpen = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResizing);
}

function startDragging(e: MouseEvent) {
  const container = document.getElementById('chrome-extension-floating-popup-container');
  if (!container) return;

  isDragging = true;

  // Calculate the offset of the mouse cursor from the container edge
  const rect = container.getBoundingClientRect();
  dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  // Add event listeners for dragging
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);

  e.preventDefault();
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return;

  const container = document.getElementById('chrome-extension-floating-popup-container');
  if (!container) return;

  // Set new position
  const newLeft = e.clientX - dragOffset.x;
  const newTop = e.clientY - dragOffset.y;

  // Make sure popup stays within viewport
  const maxLeft = window.innerWidth - container.offsetWidth;
  const maxTop = window.innerHeight - container.offsetHeight;

  container.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
  container.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
}

function stopDragging() {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
}

// Variables for resize functionality
let isResizing = false;
let originalWidth = 0;
let originalHeight = 0;
let originalMouseX = 0;
let originalMouseY = 0;

function startResizing(e: MouseEvent) {
  const container = document.getElementById('chrome-extension-floating-popup-container');
  if (!container) return;

  isResizing = true;

  // Store the initial width and height
  originalWidth = container.offsetWidth;
  originalHeight = container.offsetHeight;
  originalMouseX = e.clientX;
  originalMouseY = e.clientY;

  // Add event listeners for resizing
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResizing);

  e.preventDefault();
}

function onResize(e: MouseEvent) {
  if (!isResizing) return;

  const container = document.getElementById('chrome-extension-floating-popup-container');
  if (!container) return;

  // Calculate new width and height
  const newWidth = originalWidth + (e.clientX - originalMouseX);
  const newHeight = originalHeight + (e.clientY - originalMouseY);

  // Apply minimum size constraints
  if (newWidth >= 200) {
    container.style.width = `${newWidth}px`;
  }

  if (newHeight >= 200) {
    container.style.height = `${newHeight}px`;
  }
}

function stopResizing() {
  isResizing = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResizing);
}
