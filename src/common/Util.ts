export const AppUtility = {
    guid: () => {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    // ISO date sting to local time
    isoToLocalTime: (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleString();
    }
}