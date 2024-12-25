//@ts-nocheck
export enum UserStateEnum {
    REGISTERED = "Registered",
    IMAGE_SELECTED = "Image Selected",
    GARMENT_SELECTED = "Garment Selected",
    IMAGE_PROCESSED = "Image Processed",
}

export enum ProcessActionEnum {
    ADD_USER = "ADD_USER",
    SEND_IMAGE = "SEND_IMAGE",
    UPDATE_USER = "UPDATE_USER"
}

export enum ProcessActionTypeEnum {
    SELECTED_USER_GARMENT = "SELECTED_USER_GARMENT",
    SELECTED_USER_IMAGE = "SELECTED_USER_IMAGE"
}

export const AppUtility = {
    guid: () => {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    fileName: () => {
        return `${AppUtility.guid()}.jpeg`;
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
    },

    blobToBase64: (blob: Blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    dataURLtoBlob(dataURL) {
        // Split the Data URL into the header and the base64 data
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1]; // Extract the MIME type
        const bstr = atob(arr[1]); // Decode the base64 string
        const n = bstr.length;
        const u8arr = new Uint8Array(n);

        // Create a byte array from the decoded string
        for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }

        // Create and return a Blob object
        return new Blob([u8arr], { type: mime });
    },

    generateUserPayload: () => {
        return {
            "email": "",
            "user_id": "",
            "process_state": UserStateEnum.REGISTERED,
            "selected_image": "",
            "selected_garment": "",
            "processed_image": "",
            "gender": null,
            "create_on": new Date().toISOString(),
            "update_on": new Date().toISOString(),
        }
    }
}