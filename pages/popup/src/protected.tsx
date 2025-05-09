import { useState } from 'react';

interface ProtectedContentProps {
  userData: { email: string; name: string; role: string } | null;
  onLogout: () => void;
}

export const ProtectedContent = ({ userData, onLogout }: ProtectedContentProps) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'patientHistory' | 'transcript'>('transcript');

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-2 border-b border-gray-200">
        <div className="flex items-center">
          <img src="path/to/logo.svg" alt="Intelidoc-AI" className="h-8 mr-2" />
          <span className="text-lg font-semibold">Intelidoc-AI</span>
        </div>
        <div className="flex ml-auto">
          <button className="p-1 rounded-md hover:bg-gray-100" title="Fullscreen">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
            </svg>
          </button>
          <button className="p-1 rounded-md hover:bg-gray-100 ml-1" title="Close">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {activeTab === 'settings' && <SettingsScreen onLogout={onLogout} userData={userData} />}
        {activeTab === 'patientHistory' && <PatientHistoryScreen />}
        {activeTab === 'transcript' && <TranscriptScreen />}
      </main>

      <footer className="flex justify-around border-t border-gray-200 p-2">
        <button
          className={`flex flex-col items-center p-1 rounded-md ${activeTab === 'transcript' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('transcript')}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        </button>

        <button
          className={`flex flex-col items-center p-1 rounded-md ${activeTab === 'patientHistory' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('patientHistory')}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </button>

        <button
          className={`flex flex-col items-center p-1 rounded-md ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('settings')}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </footer>
    </div>
  );
};

const SettingsScreen = ({ userData, onLogout }: ProtectedContentProps) => {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Speech Language English</h3>
            <p className="text-sm text-gray-500">You would need repoen on Language Change</p>
          </div>
          <div className="relative inline-block w-12 align-middle select-none">
            <input type="checkbox" name="language" id="language" checked className="sr-only peer" />
            <div className="block h-6 bg-gray-200 rounded-full w-12 peer-checked:bg-blue-500"></div>
            <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition peer-checked:translate-x-6"></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">User Role Provider</h3>
            <p className="text-sm text-gray-500">Select your role based on your identity</p>
          </div>
          <div className="relative inline-block w-12 align-middle select-none">
            <input type="checkbox" name="userRole" id="userRole" checked className="sr-only peer" />
            <div className="block h-6 bg-gray-200 rounded-full w-12 peer-checked:bg-blue-500"></div>
            <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition peer-checked:translate-x-6"></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Auto Save</h3>
            <p className="text-sm text-gray-500">This will Enable Auto-Save</p>
          </div>
          <div className="relative inline-block w-12 align-middle select-none">
            <input type="checkbox" name="autoSave" id="autoSave" className="sr-only peer" />
            <div className="block h-6 bg-gray-200 rounded-full w-12 peer-checked:bg-blue-500"></div>
            <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition peer-checked:translate-x-6"></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Default Tab Transcript</h3>
            <p className="text-sm text-gray-500">Tab that will be opened on Starting</p>
          </div>
          <div className="relative inline-block w-12 align-middle select-none">
            <input type="checkbox" name="defaultTab" id="defaultTab" className="sr-only peer" />
            <div className="block h-6 bg-gray-200 rounded-full w-12 peer-checked:bg-blue-500"></div>
            <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition peer-checked:translate-x-6"></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Auto Start</h3>
            <p className="text-sm text-gray-500">This will auto start the Extension when you Join a meeting</p>
          </div>
          <div className="relative inline-block w-12 align-middle select-none">
            <input type="checkbox" name="autoStart" id="autoStart" className="sr-only peer" />
            <div className="block h-6 bg-gray-200 rounded-full w-12 peer-checked:bg-blue-500"></div>
            <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition peer-checked:translate-x-6"></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Sleep Study Option</h3>
            <p className="text-sm text-gray-500">Default Sleep Study Option</p>
          </div>
          <select className="border rounded-md px-3 py-2 w-1/2">
            <option>Select Sleep Study</option>
          </select>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Logout</h3>
            <p className="text-sm text-gray-500">Click to logout</p>
          </div>
          <button onClick={onLogout} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>
      </div>

      <div className="text-right mt-4">
        <p className="text-gray-500">
          Build No.
          <span className="font-semibold">3.2</span>
        </p>
      </div>
    </div>
  );
};

const PatientHistoryScreen = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Patient History</h2>

      <div className="relative mb-4">
        <input type="text" placeholder="Patient Name" className="w-full px-4 py-2 border rounded-md pr-10" />
        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Patient records would go here */}
        <div className="text-gray-500 text-center py-20">No patient records found</div>
      </div>
    </div>
  );
};

const TranscriptScreen = () => {
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Meeting Transcript</h2>
        <div className="flex space-x-2">
          <button className="p-1">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
            </svg>
          </button>
          <button className="p-1">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
          </button>
          <button className="p-1">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-blue-100 p-3 text-center mb-4">Double Click to highlight messages.</div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="bg-black text-white p-4 rounded-md mb-4">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"></path>
          </svg>
        </div>
        <p className="text-gray-600">Transcription will begin as soon as somebody talks...</p>
      </div>
    </div>
  );
};
