<<<<<<< HEAD
# TODO for SlotSwapper Features Implementation

## Unit/Integration Tests
- [ ] Install Jest and Supertest in backend/package.json
- [ ] Create backend/tests/swaps.test.js with unit tests for swap routes
- [ ] Add tests for swap-response logic (accept/reject, status updates, user ID swaps)
- [ ] Mock MongoDB for test isolation
- [ ] Run tests locally and ensure they pass

## Real-time Notifications (WebSockets)
- [ ] Install Socket.io in backend/package.json and frontend/package.json
- [ ] Update backend/server.js to integrate Socket.io server
- [ ] Modify backend/routes/swaps.js to emit events on swap request creation and response
- [ ] Update frontend/src/components/Requests.js to listen for WebSocket events and update UI in real-time
- [ ] Test WebSocket notifications by simulating requests

## Deployment
- [ ] Configure vercel.json for frontend deployment on Vercel
- [ ] Add Procfile for backend deployment on Heroku
- [ ] Update package.json scripts for production builds
- [ ] Deploy frontend to Vercel and backend to Render/Heroku
- [ ] Test deployed application

## Containerization
- [ ] Create Dockerfile for backend (Node.js app)
- [ ] Create docker-compose.yml for full stack (backend, MongoDB, frontend build)
- [ ] Test local setup with Docker

## Documentation
- [ ] Update README.md with setup, deployment, and usage instructions
- [ ] Document API endpoints, WebSocket events, and testing procedures
=======
 
>>>>>>> f0e65af9e4edca34a8cb791af8f319c24d2e1079
