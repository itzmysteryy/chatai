## D1. Keeping third-party API credentials confidential from browser clients
struggled with: none
found on their own: identified the need for an intermediate server to handle fetching and posting requests to the AI rather than calling it directly from the client
did well: immediately recognized the server proxy boundary and anticipated server-side context injection
did ok:


## D2. Guiding an open-ended model to follow strict tutoring guidelines
struggled with: none
found on their own: prepending instructions at the beginning of the messages list and storing them in a separate text/markdown file
did well: recognized that instructions need to be attached on every outgoing model request and decoupled into a separate file
did ok:


## D3. Retaining dialogue context across stateless HTTP requests
struggled with: none
found on their own: in-memory client-side message array in script.js that lives only for the page session
did well: recognized the trade-off of ephemeral browser memory (cleared on refresh) avoiding complex server-side session management
did ok:


## D4. Restricting public access to prevent runaway API costs
struggled with: where the secret password check should be enforced without leaking it
found on their own: simple password / passcode concept
did well: recognized that individual user accounts were unnecessary overhead
did ok: picked the server-side environment variable gate once options were laid out


## D5. Verifying user credentials before they compose messages
struggled with: none
found on their own: two-stage flow with dedicated verification request to server before revealing chat interface
did well: clearly separated frontend UI state from backend credential validation
did ok:


## D6. Delivering application interface and dynamic endpoints without cross-origin complexity
struggled with: initially proposed separate ports (3000 and 8000), which introduces CORS and URL configuration issues
found on their own: recognized serving static assets directly from a 'public' directory on the backend server
did well: quickly pivoted to static directory serving once port separation constraints were raised
did ok:


## D7. Preventing upstream API failures from terminating the application service
struggled with: Node.js asynchronous error propagation and failure isolation
found on their own: none
did well: recognized the importance of keeping the student informed rather than letting sockets hang
did ok: selected route-level try-catch containment once options and crash implications were presented


## D8. Providing immediate feedback to users during multi-second model latency
struggled with: recognizing that clearing the input and drawing the user bubble before the fetch completes is already optimistic rendering
found on their own: temporary loading indicator ("thinking...") and disabling message controls to debounce in-flight requests
did well: proposed solid UI enhancements for handling long asynchronous round-trips
did ok:
