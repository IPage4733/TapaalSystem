import axios from 'axios';
import { getAuthToken, removeAuthToken } from './authService';

const API_BASE_URL = 'https://vpap7qh4n2.execute-api.ap-southeast-1.amazonaws.com/dev';
const ADD_COMMENT_ENDPOINT = 'commentPost';
const GET_COMMENTS_ENDPOINT = 'https://0by5du2nsa.execute-api.ap-southeast-1.amazonaws.com/dev/getComment';
const GET_COMMENT_BY_ID_ENDPOINT = 'https://u28clbdp05.execute-api.ap-southeast-1.amazonaws.com/dev';
const DELETE_COMMENT_ENDPOINT = 'https://jx87yd8jq0.execute-api.ap-southeast-1.amazonaws.com/dev';

// Create an axios instance with default configL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Comment {
  id: string;
  tappalId: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

const isCommentObject = (value: unknown): value is Comment => {
  if (!value || typeof value !== 'object') return false;
  const comment = value as Partial<Comment>;
  return (
    typeof comment.id === 'string' &&
    typeof comment.tappalId === 'string' &&
    typeof comment.userId === 'string' &&
    typeof comment.userName === 'string' &&
    typeof comment.comment === 'string' &&
    typeof comment.timestamp === 'string'
  );
};

export const getAllComments = async (): Promise<Comment[]> => {
  try {
    const response = await api.get(GET_COMMENTS_ENDPOINT);
    const { data } = response;

    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray((data as { comments?: Comment[] }).comments)) {
      return (data as { comments?: Comment[] }).comments ?? [];
    }

    console.error('Unexpected comments response format:', data);
    throw new Error('Unexpected response format when fetching comments');
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const getCommentsByTappalId = async (tappalId: string): Promise<Comment[]> => {
  const comments = await getAllComments();
  return comments.filter((comment) => comment.tappalId === tappalId);
};

export const getCommentById = async (commentId: string): Promise<Comment> => {
  try {
    const response = await api.get(`${GET_COMMENT_BY_ID_ENDPOINT}/${commentId}`);
    const { data } = response;

    if (isCommentObject(data)) {
      return data;
    }

    if (data && isCommentObject((data as { comment?: Comment }).comment)) {
      return (data as { comment: Comment }).comment;
    }

    console.error('Unexpected get comment by id response format:', data);
    throw new Error('Unexpected response format when fetching comment');
  } catch (error) {
    console.error(`Error fetching comment with id ${commentId}:`, error);
    throw error;
  }
};

export const addComment = async (commentData: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> => {
  try {
    const response = await api.post(ADD_COMMENT_ENDPOINT, commentData);
    return response.data;
  } catch (error: any) {
    console.error('Error adding comment:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: error.config
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      removeAuthToken();
      throw new Error('Authentication failed. Please log in again.');
    }
    
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    await api.delete(`${DELETE_COMMENT_ENDPOINT}/${commentId}`);
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this comment.');
    }
    throw error;
  }
};
