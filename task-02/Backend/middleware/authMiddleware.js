// Mock authentication middleware
// In a real application, this would verify a JWT token or session
exports.protect = (req, res, next) => {
  // Extract user ID from headers for mocking purposes
  // Default to a mock user if header is not present
  const userId = req.headers['x-user-id'] || 'mock-user-123';
  
  req.user = {
    id: userId
  };
  
  next();
};
