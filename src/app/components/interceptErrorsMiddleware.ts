'use client';

// This middleware intercepts fetch requests and responses to the copilotkit API
// and provides error handling capability

// Set up a window-level event for other components to listen to
export const triggerApiErrorEvent = (error: any) => {
  console.log('Triggering API error event:', error);
  try {
    const event = new CustomEvent('copilotkit-api-error', { 
      detail: { error } 
    });
    window.dispatchEvent(event);
    return true;
  } catch (e) {
    console.error('Error triggering API error event:', e);
    return false;
  }
};

const originalFetch = global.fetch;

// Replace the global fetch with our intercepting version
if (typeof window !== 'undefined') {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Only intercept requests to our copilotkit API
    if (typeof input === 'string' && input.includes('/api/copilotkit')) {
      console.log('Intercepting API request to:', input);
      try {
        const response = await originalFetch(input, init);
        
        // Clone the response to read its body
        const clonedResponse = response.clone();
        
        // Check for error responses
        if (!response.ok) {
          console.log('API responded with error status:', response.status);
          try {
            const errorData = await clonedResponse.json();
            console.error('CopilotKit API error:', errorData);
            
            // Enhanced logging for debugging
            console.log('Error details:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            
            triggerApiErrorEvent(errorData);
          } catch (parseError) {
            // If we can't parse the error as JSON, use the status text
            console.log('Failed to parse error response as JSON');
            const errorData = { 
              error: response.statusText || 'Unknown error',
              message: `Error ${response.status}: ${response.statusText}`,
              status: response.status,
              code: 'parse_error'
            };
            console.error('CopilotKit API error (parsed from status):', errorData);
            triggerApiErrorEvent(errorData);
          }
        } else {
          // Check for error responses that might have 200 status but contain error data
          try {
            const responseData = await clonedResponse.json();
            if (responseData.error) {
              console.error('CopilotKit API returned error in 200 response:', responseData);
              triggerApiErrorEvent(responseData);
            }
          } catch (parseError) {
            // Not a JSON response or no error in the response, continuing normally
          }
        }
        
        return response;
      } catch (networkError) {
        console.error('Network error with CopilotKit API:', networkError);
        const errorData = {
          error: 'Network Error',
          message: 'Failed to connect to the CopilotKit API. Please check your internet connection.',
          code: 'network_error',
          status: 0
        };
        triggerApiErrorEvent(errorData);
        throw networkError;
      }
    }
    
    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };
}

export default function initErrorInterceptor() {
  // This is a no-op function that just ensures the module is imported
  console.log('API error interceptor initialized');
} 