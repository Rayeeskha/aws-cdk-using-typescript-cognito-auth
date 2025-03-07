exports.handler = async (event:any) => {
    console.log("Request event:", JSON.stringify(event, null, 2));

    // Check for the Authorization header
    const authHeader = event.headers?.Authorization;
    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized: Missing token" }),
        };
    }

    // Validate the token (optional, but recommended)
    // For local testing, you can skip validation or use a mock validation function

    // If the token is present, return a success response
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Authenticated request successful!" }),
    };
};