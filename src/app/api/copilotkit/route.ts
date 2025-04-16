// Import necessary modules and classes from various packages.
import { CopilotBackend, OpenAIAdapter } from "@copilotkit/backend"; // For backend functionality with CopilotKit.
import { researchWithLangGraph } from "./research"; // Import a custom function for conducting research.
import { AnnotatedFunction } from "@copilotkit/shared"; // For annotating functions with metadata.

// Define a runtime environment variable, indicating the environment where the code is expected to run.
export const runtime = "edge";

// Define an annotated function for research. This object includes metadata and an implementation for the function.
const researchAction: AnnotatedFunction<any> = {
  name: "research", // Function name.
  description: "Call this function to conduct research on latest events happening in the destination country and within  the timelines.", // Function description.
  argumentAnnotations: [ // Annotations for arguments that the function accepts.
    {
      name: "topic", // Argument name.
      type: "string", // Argument type.
      description: "Latest events happening in destination country/region. Also please consider the weather forecasts", // Argument description.
      required: true, // Indicates that the argument is required.
    },
  ],
  implementation: async (topic) => { // The actual function implementation.
    console.log("Researching topic: ", topic); // Log the research topic.
    return await researchWithLangGraph(topic); // Call the research function and return its result.
  },
};

// Define an asynchronous function that handles POST requests.
export async function POST(req: Request): Promise<Response> {
  try {
    // Clone the request to ensure we can read it multiple times
    const clonedReq = req.clone();
    
    const requestData = await req.json();
    console.log("Request data received and parsed");
    // Initialize the data variable
    let userApiKey = null;

    // Try extracting the API key from various possible locations
    try {
      // 1. Check if it's in the action arguments
      if (requestData.action?.arguments) {
        const args = requestData.action.arguments;
        if (typeof args === 'object') {
          if (args.apiKey) {
            userApiKey = args.apiKey;
            console.log("Found API key in action.arguments.apiKey");
          } else if (args.formData?.apiKey) {
            userApiKey = args.formData.apiKey;
            console.log("Found API key in action.arguments.formData.apiKey");
          }
        }
      }

      // 2. Check in messages content for JSON with apiKey
      if (!userApiKey && requestData.messages && requestData.messages.length > 0) {
        // Take the last message's content
        const lastMessageContent = requestData.messages[requestData.messages.length - 1].content;
        
        // Try to find an embedded JSON that might contain the API key
        try {
          // Look for patterns that might contain JSON
          const jsonRegex = /{[^{}]*"apiKey"[^{}]*}/g;
          const jsonMatches = lastMessageContent.match(jsonRegex);
          
          if (jsonMatches && jsonMatches.length > 0) {
            for (const jsonStr of jsonMatches) {
              try {
                const jsonData = JSON.parse(jsonStr);
                if (jsonData.apiKey) {
                  userApiKey = jsonData.apiKey;
                  console.log("Found API key in JSON within message content");
                  break;
                }
              } catch (parseError) {
                // Continue to next match if this one can't be parsed
              }
            }
          }
          
          // Also check for formData patterns
          const formDataRegex = /{[^{}]*"formData"[^{}]*}/g;
          const formDataMatches = lastMessageContent.match(formDataRegex);
          
          if (!userApiKey && formDataMatches && formDataMatches.length > 0) {
            for (const formDataStr of formDataMatches) {
              try {
                const formData = JSON.parse(formDataStr);
                if (formData.formData?.apiKey) {
                  userApiKey = formData.formData.apiKey;
                  console.log("Found API key in formData JSON within message content");
                  break;
                }
              } catch (parseError) {
                // Continue to next match if this one can't be parsed
              }
            }
          }
        } catch (jsonError) {
          console.warn("Error parsing JSON in message content:", jsonError);
        }
      }

      // 3. Fallback to direct regex extraction if needed
      if (!userApiKey && requestData.messages && requestData.messages.length > 0) {
        // Extract API key using regex if it's in the format "apiKey":"value"
        const lastMessageContent = requestData.messages[requestData.messages.length - 1].content;
        const apiKeyRegex = /"apiKey"\s*:\s*"([^"]+)"/;
        const apiKeyMatch = lastMessageContent.match(apiKeyRegex);
        
        if (apiKeyMatch && apiKeyMatch[1]) {
          userApiKey = apiKeyMatch[1];
          console.log("Found API key using regex extraction");
        }
      }
    } catch (extractionError) {
      console.error("Error extracting API key:", extractionError);
    }
    
    // Fallback to environment variable if no API key found in the request
    if (!userApiKey) {
      userApiKey = process.env.OPENAI_API_KEY;
      if (userApiKey) {
        console.log("Using environment variable for API key");
      }
    }
    
    // Set the API key as an environment variable for this request
    if (userApiKey) {
      try {
        // Log the API key with only first and last few characters for debugging
        if (userApiKey.length > 10) {
          const firstFive = userApiKey.substring(0, 5);
          const lastFive = userApiKey.substring(userApiKey.length - 5);
          console.log(`Using user-provided API key: ${firstFive}...${lastFive}`);
        } else {
          console.log("API key provided but too short to be valid");
          return new Response(
            JSON.stringify({ error: "The provided API key appears to be invalid (too short)." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Basic API key validation - check format (sk-...)
        if (!userApiKey.startsWith('sk-')) {
          console.error("API key does not have the correct format. Should start with 'sk-'");
          return new Response(
            JSON.stringify({ 
              error: "Invalid API key format. OpenAI API keys should start with 'sk-'.",
              details: "Please provide a valid API key from your OpenAI account."
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Set the environment variable
        process.env.OPENAI_API_KEY = userApiKey;
        console.log("API key set in environment");
        
        try {
          // Create the OpenAIAdapter with explicit options
          console.log("Creating OpenAIAdapter...");
          const openAIAdapter = new OpenAIAdapter({
            model: "gpt-3.5-turbo" // Fall back to a more stable model
          });
          console.log("OpenAIAdapter created successfully");
          
          // Define actions array and add research action if conditions met
          console.log("Setting up actions...");
          const actions: AnnotatedFunction<any>[] = [];
          
  if (process.env["TAVILY_API_KEY"]) {
            console.log('Tavily API key is set. Enabling research action.');
            actions.push(researchAction);
          } else {
            console.log('No Tavily API key found. Research action disabled.');
          }
          
          // Instantiate CopilotBackend with the actions defined above
          console.log("Creating CopilotBackend...");
  const copilotKit = new CopilotBackend({
    actions: actions,
  });
          console.log("CopilotBackend created successfully");

          // Inspect the request format
          console.log("Request format check:", {
            method: clonedReq.method,
            headers: Object.fromEntries(clonedReq.headers.entries()),
            url: clonedReq.url,
          });

          // Use the CopilotBackend to generate response
          console.log("Sending request to CopilotBackend...");
          try {
            // Create a new request with the original body to ensure it's not consumed
            const newRequest = new Request(clonedReq.url, {
              method: clonedReq.method,
              headers: clonedReq.headers,
              body: JSON.stringify(requestData),
            });
            
            const response = await copilotKit.response(newRequest, openAIAdapter);
            console.log("Response received from CopilotBackend");
            return response;
          } catch (apiError: any) {
            console.error("Error from OpenAI API:", apiError);
            
            // Check for specific OpenAI error types
            if (apiError.code === 'invalid_api_key' || apiError.status === 401) {
              console.log("Returning authentication error response");
              return new Response(
                JSON.stringify({ 
                  error: "Authentication failed with OpenAI API", 
                  message: apiError.error?.message || "Your API key was rejected by OpenAI. Please provide a valid API key.",
                  code: apiError.code || "invalid_api_key",
                  status: 401
                }),
                { 
                  status: 401, 
                  headers: { 
                    "Content-Type": "application/json",
                    // Add CORS headers for error responses
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                  } 
                }
              );
            } else if (apiError.status === 429) {
              // Rate limit error
              console.log("Returning rate limit error response");
              return new Response(
                JSON.stringify({ 
                  error: "Rate limit exceeded", 
                  message: "You have sent too many requests to the OpenAI API. Please try again later.",
                  code: "rate_limit_exceeded",
                  status: 429
                }),
                { 
                  status: 429, 
                  headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                  } 
                }
              );
            } else {
              // Generic error
              console.log("Returning generic error response");
              return new Response(
                JSON.stringify({ 
                  error: "Error communicating with OpenAI API", 
                  message: apiError.error?.message || apiError.message || String(apiError),
                  status: apiError.status || 500,
                  code: apiError.code || "unknown_error"
                }),
                { 
                  status: apiError.status || 500, 
                  headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                  } 
                }
              );
            }
          }
        } catch (processingError: any) {
          console.error("Error during response processing:", processingError);
          return new Response(
            JSON.stringify({ 
              error: "Error processing request with OpenAI. Please check logs for details.", 
              message: processingError.message || String(processingError)
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (adapterError) {
        console.error("Error with OpenAI adapter:", adapterError);
        return new Response(
          JSON.stringify({ error: "Error setting up OpenAI adapter. Please check your API key." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error("No API key found in the request data");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key is required. Please provide a valid API key.",
          data: JSON.stringify(requestData.messages[0].content).substring(0, 200) + "..." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
