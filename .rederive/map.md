# Decision map
repo: chatai | built from: unversioned | date: 2026-11-16
root problem: Students learning high school mathematics (1T) need an accessible, interactive web assistant that guides them through math problems step-by-step in Norwegian without giving away answers, while protecting paid API credentials and preventing unauthorized access.

## D1. Keeping third-party API credentials confidential from browser clients
- Problem: Students interacting with a web interface need responses from an AI provider that bills usage using a secret API key, without students or third parties being able to inspect or steal the key.
- Given: A browser-based web application and an external LLM HTTP endpoint requiring a paid API secret key.
- Constraints, in order:
  1. Any code, asset, or network request dispatched directly by a browser can be inspected via developer tools -> breaks: Calling the LLM API directly from browser JavaScript with the API key embedded in client code.
  2. External AI providers enforce cross-origin policies or restrict direct browser origins -> breaks: Direct browser-to-provider connections without backend mediation.
- Decision: Backend API proxy: an intermediate server running in a trusted environment that receives client requests, attaches the secret key securely, and forwards them to the external provider.
- Options:
  - Direct browser-to-API calls with embedded secret (zero server setup, but completely leaks the secret key to anyone inspecting web traffic).
  - Backend API proxy (requires maintaining a server process, but keeps credentials completely isolated in a secure server environment).
  - Ephemeral serverless function proxy (avoids managing a continuous server, but introduces cold-start latency on conversational turns).
- Evidence: code only, files server.js, public/script.js

## D2. Guiding an open-ended model to follow strict tutoring guidelines
- Problem: The raw language model provides direct numerical answers immediately and formats text with markdown symbols, whereas the pedagogical goal requires conversational step-by-step coaching in Norwegian Bokmål using plain text.
- Given: A backend proxy capable of sending structured messages to the LLM.
- Constraints, in order:
  1. Foundation models default to direct answering and generic personas unless explicit system-level instructions establish persona boundaries -> breaks: Forwarding raw user questions directly to the model without role instructions.
  2. Untrusted browser clients can modify, remove, or override prompt instructions if instruction composition is delegated to the client -> breaks: Allowing the browser application to construct and send the system prompt.
- Decision: Server-side system instruction injection: reading instructions from an external file on the server and prepending a system message to the message payload before invoking the model API.
- Options:
  - Client-side instruction packaging (simple for frontend developers to change, but vulnerable to client tampering or removal).
  - Model fine-tuning (bakes behavior into weights, but requires large training datasets, high costs, and slow iteration cycles).
  - Server-side instruction file injection (cheap, decoupled from code logic, tamper-proof against client modification, and updates immediately without redeployment).
- Evidence: code only, files server.js, instructions.txt

## D3. Retaining dialogue context across stateless HTTP requests
- Problem: Math tutoring requires back-and-forth dialogue where questions refer to prior intermediate steps, but web requests to LLM APIs are independent and retain no memory between calls.
- Given: A client and server communicating via stateless HTTP request/response cycles.
- Constraints, in order:
  1. The LLM provider API does not store conversation state between HTTP requests -> breaks: Transmitting only the most recent user message string on each request.
  2. Storing conversation histories in server memory across multiple concurrent anonymous students leads to memory leaks and requires session tracking mechanisms -> breaks: Storing conversation arrays in server memory without session identifiers or database infrastructure.
- Decision: Client-side history accumulator: maintaining the full sequence of user and assistant messages in browser memory and transmitting the entire dialogue history with each outgoing request.
- Options:
  - Single-turn stateless queries (simplest to implement and lowest token cost, but completely prevents multi-step conversational explanations).
  - Server-side session database (preserves history across browser refreshes, but introduces database dependencies, session tokens, and storage lifecycle management).
  - In-memory client-side history array (zero server state or database overhead, simple serialization, though history is cleared if the page refreshes).
- Evidence: code only, files public/script.js, server.js

## D4. Restricting public access to prevent runaway API costs
- Problem: Anyone finding the web service on the internet could send unlimited queries, depleting the owner's paid LLM account balance.
- Given: A publicly accessible web server exposing an endpoint that triggers paid API calls.
- Constraints, in order:
  1. Anyone with access to the URL or API endpoint can trigger token-generating calls that incur real financial costs -> breaks: Leaving the chat endpoint open and unauthenticated.
  2. Implementing a full multi-user authentication system is disproportionately complex for a single classroom or cohort tool -> breaks: Building a multi-tenant user authentication system with databases, password hashing, and user registration.
  3. Client-side gating alone can be bypassed by inspecting network calls and issuing requests directly to the endpoint -> breaks: Hiding the chat form in the browser while leaving the backend route unprotected.
- Decision: Shared secret access gate: validating a pre-shared access password against a server environment variable on every incoming protected request.
- Options:
  - No access control (frictionless for users, but leaves the API bill vulnerable to public discovery and bot scraping).
  - Client-only UI gating (shows a password prompt in HTML/JS without server verification; trivially bypassed via curl or DevTools).
  - Full per-user database authentication (comprehensive auditing and user tracking, but requires significant database infrastructure, auth flow development, and maintenance).
  - Shared secret environment-variable verification (requires zero database setup, easily distributed to a cohort of students, and protects backend calls from unauthorized consumption).
- Evidence: code only, files server.js, public/script.js

## D5. Verifying user credentials before they compose messages
- Problem: A student needs immediate confirmation that their password is valid before investing time writing out a math problem, rather than discovering a typo after submitting a question.
- Given: A password-protected backend and a two-stage single-page web interface.
- Constraints, in order:
  1. Validating credentials only when sending a question forces the user to wait through failure after drafting complex input -> breaks: Bundling authentication checking solely into the message submission endpoint.
  2. Storing the password in client JavaScript to validate locally exposes the secret to anyone viewing source code -> breaks: Verifying the password directly in frontend code without a backend check.
- Decision: Two-phase authentication handshake: providing a lightweight dedicated verification endpoint to check credentials and reveal the chat interface, while retaining the credential for subsequent message requests.
- Options:
  - Single endpoint validation on message send (saves one route, but provides poor user experience by delaying authentication feedback until after message composition).
  - Client-side hardcoded password comparison (instant feedback without network roundtrip, but completely reveals the password in plaintext browser source code).
  - Dedicated verification endpoint followed by protected operational calls (provides instant UX feedback upon login while keeping credential verification securely on the server).
- Evidence: code only, files server.js, public/script.js, public/index.html

## D6. Delivering application interface and dynamic endpoints without cross-origin complexity
- Problem: The application requires serving static frontend assets (HTML, JavaScript, CSS) and dynamic JSON API endpoints to the user's browser.
- Given: Static frontend files and an HTTP server process.
- Constraints, in order:
  1. Hosting frontend assets on a separate web server or port from API routes introduces cross-origin resource sharing (CORS) preflights, complex origin configurations, and separate deployment lifecycles -> breaks: Hosting static assets and dynamic APIs on different servers or ports.
  2. Hardcoding backend hostnames and ports into client JavaScript breaks when moving between local development and production environments -> breaks: Using absolute URLs in frontend network calls.
- Decision: Unified single-origin host: configuring the application server to serve static assets directly from a designated directory alongside dynamic API routes under the same origin.
- Options:
  - Split deployment with separate static CDN and backend API service (optimal for massive static scale, but requires CORS headers, environment-specific URL configs, and dual deployments).
  - Unified single-origin hosting with static middleware (simplifies deployment to a single process, eliminates CORS friction for same-origin requests, and allows relative API paths).
- Evidence: code only, files server.js

## D7. Preventing upstream API failures from terminating the application service
- Problem: Network disruptions, rate limits, or unexpected errors from the external AI provider must not crash the web server process or leave client requests unresolved.
- Given: Asynchronous network communication between the backend server and the external AI service.
- Constraints, in order:
  1. Unhandled promise rejections in Node.js event loops can terminate the server process or leave HTTP sockets hanging indefinitely -> breaks: Awaiting external API calls without error boundaries.
  2. Clients require clear error statuses to notify the user rather than hanging until browser timeout -> breaks: Failing silently without sending an HTTP response.
- Decision: Async error boundary: enclosing upstream external calls in a try-catch block, logging error diagnostics on the server, and returning a structured HTTP 500 error response to the client.
- Options:
  - Unhandled promise execution (fewer lines of code, but any upstream network timeout or 429 rate limit crashes the server process).
  - Global uncaughtException process hook (prevents process termination, but loses route context and fails to notify the specific client that initiated the request).
  - Route-level asynchronous try-catch containment (catches upstream failures locally, logs errors for debugging, and returns an informative HTTP 500 status to the client).
- Evidence: code only, files server.js

## D8. Providing immediate feedback to users during multi-second model latency
- Problem: Large language models take several seconds to generate responses; without immediate feedback, users assume the application is frozen and re-submit or refresh.
- Given: A browser user interface submitting asynchronous message requests.
- Constraints, in order:
  1. Network transmission and model inference take noticeable time (1-5 seconds) -> breaks: Delaying all UI updates until the entire HTTP request/response cycle finishes.
  2. Leaving the input text intact after submission leads users to click repeatedly or re-enter text -> breaks: Leaving input field contents unchanged while awaiting remote completion.
- Decision: Optimistic UI rendering: immediately appending the user's message to the DOM and clearing the input field upon submission, before the network request resolves, and rendering the response when received.
- Options:
  - Pessimistic rendering: only update the DOM after the server returns the response (ensures server confirmation before displaying anything, but feels laggy and unresponsive to users).
  - Optimistic rendering: append input immediately to the DOM and conversation state, clear input field, then asynchronously append the assistant reply on resolution (provides instant tactile confirmation and smooth chat experience).
- Evidence: code only, files public/script.js
