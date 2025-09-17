const { createServer } = require('node:http');
const fs = require ("node:fs");
const path = require ("node:path");
const url = require("url");

const jwt = require("jsonwebtoken");

const hostname = 'localhost';
const port = 9090;

// taken from https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework
// we needed to serve the static files from the frontend folder from the backend to avoid CORS issues
const STATIC_PATH = path.join(process.cwd(), "../frontend");
const toBool = [() => true, () => false];

/**
 * Prepares a file for streaming by validating path and checking existence
 * @param {string} url - The URL path to the requested file
 * @returns {Promise<Object>} Object containing:
 *   @returns {boolean} found - Whether the file was found and is accessible
 *   @returns {string} ext - The file extension without the dot
 *   @returns {ReadStream} stream - Readable stream of the file contents
 * @throws {Error} If there are file system access errors
 */
const prepareFile = async (url) => {
    const paths = [STATIC_PATH, url];
    if (url.endsWith("/")) paths.push("index.html");
    const filePath = path.join(...paths);
    const pathTraversal = !filePath.startsWith(STATIC_PATH);
    const exists = await fs.promises.access(filePath).then(...toBool);
    const found = !pathTraversal && exists;
    const streamPath = found ? filePath : STATIC_PATH + "/404.html";
    const ext = path.extname(streamPath).substring(1).toLowerCase();
    const stream = fs.createReadStream(streamPath);
    return { found, ext, stream };
};

// this is the signing key that Metabase provides in settings->admin->auth->JWT, which is used to sign the JWT token for interactive embedding
const JWT_SIGNING_KEY_INTERACTIVE_EMBEDDING = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const METABASE_URL = 'http://localhost:3000'

// this is where we sign the user token with the interactive embedding signing key
/**
 * Generates a JSON Web Token (JWT) for a user with their information
 * @param {Object} user - The user object containing personal information
 * @param {string} user.email - User's email address
 * @param {string} user.first_name - User's first name
 * @param {string} user.last_name - User's last name
 * @param {number} user.exp - Token expiration timestamp
 * @param {string[]} user.groups - Array of groups the user belongs to
 * @returns {string} Signed JWT containing user information
 */
const signUserToken = user =>
    jwt.sign(
      {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        exp: user.exp,
        groups: user.groups,
      },
      JWT_SIGNING_KEY_INTERACTIVE_EMBEDDING
    );

const server = createServer(async (req, res) => {
    const url_parts = url.parse(`http://localhost:3000${req.url}`, true);
    switch (url_parts.pathname) {
        case '/api/health': // health check endpoint to make the frontend aware that the backend is running. It's not checking for anything at all, just returning a 200 status code
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            return res.end();
        case '/api/auth': // this is the endpoint that the frontend will call to get the SSO URL            
            // this is the user that will be used to SSO and signed with the interactive embedding signing key for interactive embedding
            const user = {
                email: "someone@somedomain.com",
                first_name: "Someone",
                last_name: "Somebody",
                exp: Math.floor(Date.now() / 1000) + 60 * 60, // this is the expiration time for the token, in this case, it's 1 hour
                groups: ["viewer"], // groups property is optional, we're sending this to show how you can configure group mappings in Metabase
            }

            const isSdkRequest = url_parts.query.response === "json";

            if (isSdkRequest) {
                // For SDK requests, return a JSON object with the JWT.
                console.log("SDK request detected, returning JWT in JSON response");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jwt: signUserToken(user) }));
            } else {
                console.log("Non-SDK request detected, redirecting to Metabase SSO");
                // For interactive embedding, construct the Metabase SSO URL
                // and redirect the user's browser to it.
                res.writeHead(302, {
                    'Location': url.format({
                        pathname: `${METABASE_URL}/auth/sso`,
                        query: {
                            jwt: signUserToken(user),
                            return_to: url_parts.query['return_to'],
                            // you can also include more parameters to customize the features you want to expose: https://www.metabase.com/docs/latest/embedding/interactive-embedding#showing-or-hiding-metabase-ui-components
                        },
                    }),
                });
            }

            return res.end();
        default:
            // also taken from https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework
            const file = await prepareFile(req.url);
            const statusCode = file.found ? 200 : 404;
            const mimeType = "text/html; charset=UTF-8";
            res.writeHead(statusCode, { "Content-Type": mimeType });
            file.stream.pipe(res);
            console.log(`${req.method} ${req.url} ${statusCode}`);
    }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
