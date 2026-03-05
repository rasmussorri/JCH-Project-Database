import { supabase } from '../../../lib/supabaseClient';
import type { CreateUploadSessionResponse, SignUploadResponse } from '../types';

export async function createUploadSession(
  projectId: string,
  password: string,
  appBaseUrl: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(
    'create-upload-session',
    { body: { projectId, password: password.trim(), appBaseUrl } },
  );

  if (error) {
    throw new Error('Failed to create upload link. Please check the password.');
  }

  const response = data as CreateUploadSessionResponse | null;
  if (!response?.uploadUrl) {
    throw new Error('Upload link was not returned. Please try again.');
  }

  return response.uploadUrl;
}

export async function signUpload(
  token: string,
  fileExt: string,
  contentType: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('sign-upload', {
    body: { token, fileExt, contentType },
  });

  if (error) {
    throw error;
  }

  const response = data as SignUploadResponse | null;
  if (!response?.signedUrl) {
    throw new Error('Missing signed URL');
  }

  return response.signedUrl;
}
