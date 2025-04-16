/**
 * Utility functions for handling base64 encoding and decoding
 */

// Add type declaration for Buffer if it's not available
declare const Buffer: {
  from(data: string | Uint8Array, encoding?: string): {
    toString(encoding?: string): string;
  };
} | undefined;

/**
 * Decodes a base64 string to its original format
 * @param base64String The base64 encoded string
 * @returns The decoded data as a string
 */
export function decodeBase64(base64String: string): string {
  try {
    // For Node.js environment
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64String, 'base64').toString('utf-8');
    } 
    // For browser environment
    else {
      return atob(base64String);
    }
  } catch (error) {
    console.error('Error decoding base64:', error);
    throw new Error('Failed to decode base64 string');
  }
}

/**
 * Decodes a base64 string to a Uint8Array (for binary data)
 * @param base64String The base64 encoded string
 * @returns The decoded data as a Uint8Array
 */
export function decodeBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    // For Node.js environment
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64String, 'base64'));
    } 
    // For browser environment
    else {
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } catch (error) {
    console.error('Error decoding base64 to Uint8Array:', error);
    throw new Error('Failed to decode base64 string to Uint8Array');
  }
}

/**
 * Encodes a string to base64
 * @param data The string to encode
 * @returns The base64 encoded string
 */
export function encodeBase64(data: string): string {
  try {
    // For Node.js environment
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(data, 'utf-8').toString('base64');
    } 
    // For browser environment
    else {
      return btoa(data);
    }
  } catch (error) {
    console.error('Error encoding to base64:', error);
    throw new Error('Failed to encode string to base64');
  }
}

/**
 * Encodes a Uint8Array to base64
 * @param data The Uint8Array to encode
 * @returns The base64 encoded string
 */
export function encodeUint8ArrayToBase64(data: Uint8Array): string {
  try {
    // For Node.js environment
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(data).toString('base64');
    } 
    // For browser environment
    else {
      let binary = '';
      for (let i = 0; i < data.byteLength; i++) {
        binary += String.fromCharCode(data[i]);
      }
      return btoa(binary);
    }
  } catch (error) {
    console.error('Error encoding Uint8Array to base64:', error);
    throw new Error('Failed to encode Uint8Array to base64');
  }
} 