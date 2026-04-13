import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { apiBaseUrl } from "./api";
import { getStoredSession } from "./auth-storage";

async function getAuthToken(explicitToken?: string | null) {
  if (explicitToken) return explicitToken;
  const { token } = await getStoredSession();
  return token || "";
}

function buildFormData(asset: { uri: string; name?: string; type?: string }) {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.name || `upload-${Date.now()}`,
    type: asset.type || "application/octet-stream"
  } as any);
  return formData;
}

export async function pickAndUploadImage(explicitToken?: string | null) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Media permission is required to upload.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85
  });

  if (result.canceled || !result.assets?.length) return "";

  const asset = result.assets[0];
  const formData = buildFormData({
    uri: asset.uri,
    name: asset.fileName || `orin-image-${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg"
  });

  const token = await getAuthToken(explicitToken);
  const response = await fetch(`${apiBaseUrl}/api/uploads/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Image upload failed");
  }

  return payload?.url || "";
}

export async function pickAndUploadDocument(explicitToken?: string | null) {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    copyToCacheDirectory: true
  });

  if (result.canceled || !result.assets?.length) return "";

  const asset = result.assets[0];
  const formData = buildFormData({
    uri: asset.uri,
    name: asset.name || `orin-doc-${Date.now()}.pdf`,
    type: asset.mimeType || "application/pdf"
  });

  const token = await getAuthToken(explicitToken);
  const response = await fetch(`${apiBaseUrl}/api/uploads/file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "File upload failed");
  }

  return payload?.url || "";
}
