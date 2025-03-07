const { handler } = require("../lib/lambda/index");
const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");

const USER_POOL_ID = "";
const CLIENT_ID = "";
const TEST_USERNAME = "+919554540272";
const TEST_PASSWORD = "rayees@1234";

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-2" });

describe("Cognito Admin Authenticated Lambda Test", () => {
    let idToken = "";

    beforeAll(async () => {
        try {
            // Step 1: Initiate Admin Auth
            const authResponse = await cognitoClient.send(
                new AdminInitiateAuthCommand({
                    AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                    UserPoolId: USER_POOL_ID,
                    ClientId: CLIENT_ID,
                    AuthParameters: {
                        USERNAME: TEST_USERNAME,
                        PASSWORD: TEST_PASSWORD,
                    },
                })
            );

            // Check if authentication was successful
            if (authResponse.AuthenticationResult?.IdToken) {
                idToken = authResponse.AuthenticationResult.IdToken;
                console.log("✅ Token received:", idToken);
            } else {
                throw new Error("No token received!");
            }
        } catch (error) {
            console.error("❌ Authentication failed:", error);
            throw error; // Fail the test if authentication fails
        }
    });

    it("should return a success message with a valid token", async () => {
        const event = {
            headers: { Authorization: idToken },
            requestContext: {
                authorizer: {
                    claims: { sub: "admin-user-123" },
                },
            },
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ message: "Authenticated request successful!" });
    });

    it("should return an error for missing token", async () => {
        const event = {}; // No auth token
        const response = await handler(event);
        expect(response.statusCode).toBe(401);
        expect(JSON.parse(response.body)).toHaveProperty("message");
    });
});