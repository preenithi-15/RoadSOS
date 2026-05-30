/**
 * RoadSoS Mock API
 * 
 * This file exports empty async stub functions that will be replaced
 * by real API calls as the backend is built out.
 * 
 * All functions return a resolved Promise with null by default.
 */

/**
 * Trigger an SOS alert for the current user
 * @param {Object} params - { location, userId, emergencyType }
 * @returns {Promise<Object>} - SOS incident details
 */
export const triggerSOS = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Get list of nearby emergency response agencies
 * @param {Object} params - { latitude, longitude, radius }
 * @returns {Promise<Array>} - Array of agency objects
 */
export const getAgencies = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Get list of nearby bystanders who can assist
 * @param {Object} params - { latitude, longitude, radius }
 * @returns {Promise<Array>} - Array of bystander objects
 */
export const getNearbyBystanders = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Get list of nearby hospitals and medical facilities
 * @param {Object} params - { latitude, longitude, radius }
 * @returns {Promise<Array>} - Array of hospital objects
 */
export const getNearbyHospitals = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Save a user's lifeline (medical) profile
 * @param {Object} profile - { bloodType, allergies, medications, conditions, emergencyContacts }
 * @returns {Promise<Object>} - Saved profile confirmation
 */
export const saveLifelineProfile = async (profile) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Retrieve a user's lifeline (medical) profile
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Lifeline profile object
 */
export const getLifelineProfile = async (userId) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Get hazard nodes / danger zones in an area
 * @param {Object} params - { latitude, longitude, radius }
 * @returns {Promise<Array>} - Array of hazard node objects
 */
export const getHazardNodes = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Get bridge responders available for emergency dispatch
 * @param {Object} params - { latitude, longitude, emergencyType }
 * @returns {Promise<Array>} - Array of bridge responder objects
 */
export const getBridgeResponders = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Generate a black box data snapshot for an incident
 * @param {Object} params - { incidentId, userId, sensorData }
 * @returns {Promise<Object>} - Black box data package
 */
export const generateBlackBox = async (params) => {
  // TODO: Implement real API call
  return null;
};

/**
 * Classify a voice recording for emergency type detection
 * @param {Blob|string} audioData - Audio blob or base64-encoded string
 * @returns {Promise<Object>} - Classification result { type, confidence, transcript }
 */
export const classifyVoice = async (audioData) => {
  // TODO: Implement real API call
  return null;
};
