import axios from 'axios';
import { useToast } from '../components/common/ToastContainer';

const API_BASE_URL = 'https://7f70naod23.execute-api.ap-southeast-1.amazonaws.com/dev';

export const updateTapalStatus = async (tappalId: string, status: string, reason: string) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/tapal/${tappalId}/status`,
      { status, reason },
      {
        headers: {
          'Content-Type': 'application/json',
          // Add any required authentication headers here if needed
          // 'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating tapal status:', error);
    throw error;
  }
};
