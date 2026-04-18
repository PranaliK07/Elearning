const getBackendOrigin = () => {
  if (typeof window === 'undefined') return '';
  const configured = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return '';
};

export const resolveAvatarSrc = (avatar) => {
  if (!avatar || avatar === 'default-avatar.png') return undefined;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  if (avatar.startsWith('/uploads/')) {
    return `${getBackendOrigin()}${avatar}`;
  }
  return `${getBackendOrigin()}/uploads/avatars/${avatar}`;
};

export const resolveUploadSrc = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${getBackendOrigin()}${url}`;
  return url;
};

export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return ''; // Use relative URLs for proxy
  }
  return '/';
};

