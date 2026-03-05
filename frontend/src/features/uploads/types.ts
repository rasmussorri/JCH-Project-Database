/** Response from the create-upload-session edge function. */
export interface CreateUploadSessionResponse {
  token: string;
  expiresAt: string;
  uploadUrl: string;
}

/** Response from the sign-upload edge function. */
export interface SignUploadResponse {
  storagePath: string;
  signedUrl: string;
  uploadToken: string;
}
