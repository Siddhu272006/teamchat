export const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL;

    if (!url) return '';

    // Handle Render's property: host which might miss the domain
    if (url.includes('chat-backend') && !url.includes('.onrender.com')) {
        url = `${url}.onrender.com`;
    }

    // Ensure protocol
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }

    return url;
};
