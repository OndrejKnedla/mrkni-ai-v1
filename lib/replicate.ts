import type { GenerationParams, GenerationResult } from "./types"

export async function generateImage(params: GenerationParams): Promise<GenerationResult> {
  try {
    const response = await fetch("/api/generate-image", { // Changed endpoint
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let errorMessage = "Failed to generate image"; // Default error
      try {
        // Try to get specific error from JSON response body
        const errorBody = await response.json();
        // Use the 'error' field from the backend JSON response
        if (errorBody && typeof errorBody.error === 'string') {
          errorMessage = errorBody.error;
        } else {
           console.warn("API error response did not contain expected 'error' field:", errorBody);
        }
      } catch (jsonError) {
        // If JSON parsing fails, log it but keep the default message for the user
        console.error("Failed to parse API error response as JSON:", jsonError);
        // Optionally try reading as text for debugging, but don't show raw text to user
        // try { const text = await response.text(); console.error("API error text:", text); } catch {}
      }
      // Throw the determined error message
      throw new Error(errorMessage);
    }

    // If response IS ok (2xx)
    return await response.json();

  } catch (error) { // Catches errors from fetch itself OR the thrown error above
    console.error("Error in generateImage function:", error);
    // Re-throw the error for the calling component (handleSubmit) to catch
    throw error;
  }
}

export async function checkGenerationStatus(id: string): Promise<GenerationResult> {
  try {
    // Corrected endpoint path
    const response = await fetch(`/api/image-status?id=${id}`)

    if (!response.ok) {
      // Keep the improved error handling from before
      let errorMessage = "Failed to check generation status";
      try {
        const errorBody = await response.json();
        if (errorBody && typeof errorBody.error === 'string') {
          errorMessage = errorBody.error;
        } else {
           console.warn("Status check error response did not contain expected 'error' field:", errorBody);
        }
      } catch (jsonError) {
        console.error("Failed to parse status check error response as JSON:", jsonError);
      }
      throw new Error(errorMessage);
    }

    return await response.json()
  } catch (error: any) { // Catches fetch errors or the error thrown above
    console.error("Error in checkGenerationStatus function:", error);
    // Re-throw the error for the polling logic in the component to handle
    throw error;
  }
}
