import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader, CheckCircle, XCircle } from 'lucide-react';

const APIConnectionTest = () => {
  const [tests, setTests] = useState({
    root: { status: 'pending', message: '', url: 'http://0.0.0.0:8000/' },
    health: { status: 'pending', message: '', url: 'http://0.0.0.0:8000/health' },
    authors: { status: 'pending', message: '', url: 'http://0.0.0.0:8000/api/corpus/authors' },
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    // Test root endpoint
    await testEndpoint('root', 'http://localhost:8000');
    
    // Test health endpoint
    await testEndpoint('health', 'http://localhost:8000/health');
    
    // Test authors endpoint
    await testEndpoint('authors', 'http://localhost:8000/api/corpus/authors');
  };

  const testEndpoint = async (key, url) => {
    setTests(prev => ({
      ...prev,
      [key]: { ...prev[key], status: 'testing' }
    }));

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      setTests(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: response.ok ? 'success' : 'error',
          message: response.ok ? JSON.stringify(data, null, 2) : `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        }
      }));
    } catch (error) {
      setTests(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: 'error',
          message: error.message,
          statusCode: null
        }
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
      case 'testing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'testing':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wifi className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">API Connection Diagnostics</h1>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Testing backend at:</strong> http://192.99.245.215:8000
          </p>
          <p className="text-sm text-blue-600 mt-1">
            If all tests fail, the backend server may not be running or there's a network issue.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(tests).map(([key, test]) => (
            <div
              key={key}
              className={`border-2 rounded-lg p-4 transition-colors ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(test.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg capitalize">{key} Endpoint</h3>
                    {test.statusCode && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        test.statusCode === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {test.statusCode}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 break-all">
                    {test.url}
                  </p>
                  
                  {test.message && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                        {test.message}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retest All
          </button>
          
          <button
            onClick={() => {
              setTests({
                root: { status: 'pending', message: '', url: 'http://192.99.245.215:8000/' },
                health: { status: 'pending', message: '', url: 'http://192.99.245.215:8000/health' },
                authors: { status: 'pending', message: '', url: 'http://192.99.245.215:8000/api/corpus/authors' },
              });
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Results
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">Troubleshooting:</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Ensure the FastAPI server is running: <code className="bg-yellow-100 px-1 rounded">python app.py</code></li>
            <li>Check if the server is accessible at port 8000</li>
            <li>Verify no firewall is blocking the connection</li>
            <li>Try accessing the URL directly in your browser</li>
            <li>Check for CORS issues in the browser console</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default APIConnectionTest;