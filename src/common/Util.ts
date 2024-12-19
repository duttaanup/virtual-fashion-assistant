//@ts-nocheck
export const AppUtility = {
    guid: () => {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    fileName : () => {
        return `${AppUtility.guid()}.png`;
    },

    // ISO date sting to local time
    isoToLocalTime: (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleString();
    },

    base64ToBlob: (base64String, contentType = '') => {
        const byteCharacters = atob(base64String.split(',')[1]); // Decode Base64
        const byteNumbers = new Uint8Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i); // Convert characters to byte numbers
        }
        
        return new Blob([byteNumbers], { type: contentType }); // Create Blob
    }
}